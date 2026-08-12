# ============================================================
# BookManager – Azure Storage Account
# ============================================================
#
# WHAT IS AZURE BLOB STORAGE?
# Azure Blob Storage is the Azure equivalent of AWS S3.
# It stores unstructured data: files, images, backups, logs.
#
# For BookManager it stores:
#   - Book cover images uploaded by users (/uploads container)
#   - Application logs archived from VMs (/logs container)
#   - Terraform state (optional, /tfstate container)
#
# WHY NOT STORE FILES ON THE VM?
# Traditional approach: save uploads to /var/www/uploads on the VM.
# Problem: with a Scale Set (2+ VMs), each VM has its OWN disk.
# A file uploaded to VM-1 won't be visible on VM-2.
# Solution: use shared cloud storage (Blob) accessible from all VMs.
# ============================================================

resource "azurerm_storage_account" "main" {
  name                     = "${var.project_name}st${local.unique_suffix}"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = var.storage_replication # LRS (default) or GRS

  # Security settings
  https_traffic_only_enabled      = true   # Reject plain HTTP requests
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false  # All containers are private by default

  # Blob lifecycle management (cheaper storage for old data)
  blob_properties {
    versioning_enabled = true # Keep previous versions of files

    # Soft delete: recover accidentally deleted blobs for 7 days
    delete_retention_policy {
      days = 7
    }

    container_delete_retention_policy {
      days = 7
    }
  }

  tags = local.tags
}

# ─── Blob Containers ─────────────────────────────────────────
# Containers are like folders/buckets within the storage account.

# Book cover images and other user uploads
resource "azurerm_storage_container" "uploads" {
  name                  = "uploads"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private" # Only accessible via SAS tokens or Managed Identity
}

# Archived application logs
resource "azurerm_storage_container" "logs" {
  name                  = "logs"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Terraform remote state (optional — enable after first apply)
resource "azurerm_storage_container" "tfstate" {
  name                  = "tfstate"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# ─── Lifecycle Policy ─────────────────────────────────────────
# Automatically move old data to cooler (cheaper) storage tiers.
# Cool tier: cheaper storage, same availability, slightly slower access.
# Archive tier: cheapest, but requires hours to retrieve data.
resource "azurerm_storage_management_policy" "main" {
  storage_account_id = azurerm_storage_account.main.id

  rule {
    name    = "move-old-logs-to-cool"
    enabled = true

    filters {
      prefix_match = ["logs/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        tier_to_cool_after_days_since_modification_greater_than    = 30
        tier_to_archive_after_days_since_modification_greater_than = 90
        delete_after_days_since_modification_greater_than          = 365
      }
    }
  }

  rule {
    name    = "cleanup-old-uploads"
    enabled = true

    filters {
      prefix_match = ["uploads/temp/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = 7
      }
    }
  }
}
