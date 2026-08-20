// ==============================================================================
// Azure Blob Storage Service
// ==============================================================================
// Handles file uploads to Azure Blob Storage for production.
// Replaces local filesystem storage (./uploads) which is ephemeral in containers.
//
// Usage:
//   In development (no AZURE_STORAGE_CONNECTION_STRING env var):
//     Falls back to local filesystem — existing behavior unchanged.
//
//   In production (AZURE_STORAGE_CONNECTION_STRING set by Container App):
//     Uploads files to Azure Blob Storage "uploads" container.
//     Returns the public Blob URL instead of a local path.
// ==============================================================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AzureBlobService {
  private readonly logger = new Logger(AzureBlobService.name);
  private blobServiceClient: any = null;
  private containerClient: any = null;
  private readonly isAzureConfigured: boolean;

  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>(
      'AZURE_STORAGE_CONNECTION_STRING',
    );
    const containerName =
      this.configService.get<string>('AZURE_STORAGE_CONTAINER_NAME') ||
      'uploads';

    if (connectionString) {
      try {
        // Dynamic import to avoid requiring the SDK in development
        const {
          BlobServiceClient,
        } = require('@azure/storage-blob');
        this.blobServiceClient =
          BlobServiceClient.fromConnectionString(connectionString);
        this.containerClient =
          this.blobServiceClient.getContainerClient(containerName);
        this.isAzureConfigured = true;
        this.logger.log(
          `Azure Blob Storage configured (container: ${containerName})`,
        );
      } catch (error) {
        this.logger.warn(
          'Azure Blob Storage SDK not available, falling back to local storage',
        );
        this.isAzureConfigured = false;
      }
    } else {
      this.logger.log(
        'No AZURE_STORAGE_CONNECTION_STRING — using local file storage',
      );
      this.isAzureConfigured = false;
    }
  }

  /**
   * Upload a file buffer to Azure Blob Storage.
   * Returns the public URL of the uploaded blob.
   *
   * @param fileName  - Unique file name (e.g., "uuid-cover.jpg")
   * @param buffer    - File content as Buffer
   * @param mimeType  - MIME type (e.g., "image/jpeg")
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    fileName: string,
    buffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    if (!this.isAzureConfigured || !this.containerClient) {
      throw new Error(
        'Azure Blob Storage is not configured. Set AZURE_STORAGE_CONNECTION_STRING.',
      );
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);

    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });

    this.logger.log(`Uploaded file to Azure Blob: ${fileName}`);
    return blockBlobClient.url;
  }

  /**
   * Delete a file from Azure Blob Storage.
   *
   * @param fileName - The blob name to delete
   */
  async deleteFile(fileName: string): Promise<void> {
    if (!this.isAzureConfigured || !this.containerClient) {
      return;
    }

    const blockBlobClient = this.containerClient.getBlockBlobClient(fileName);
    await blockBlobClient.deleteIfExists();
    this.logger.log(`Deleted file from Azure Blob: ${fileName}`);
  }

  /**
   * Check if Azure Blob Storage is configured.
   * Use this to decide between local vs. cloud storage at runtime.
   */
  isConfigured(): boolean {
    return this.isAzureConfigured;
  }
}
