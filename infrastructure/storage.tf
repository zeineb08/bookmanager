# ==============================================================================
# BookManager — Azure Blob Storage
# ==============================================================================
# Dual-purpose storage account:
#
# 1. Static Website hosting — serves the React SPA (index.html, JS, CSS)
#    Replaces the Nginx container from docker-compose. Static files don't
#    need compute — Blob Storage serves them at ~$0.02/GB/month.
#
# 2. "uploads" container — stores book cover images uploaded via the API.
#    Replaces the ephemeral ./uploads directory in the Docker container.
#    Files persist across container restarts and scale events.
#
# Private Endpoint ensures the backend writes to Blob Storage over the
# Azure backbone, not the public internet.
# ==============================================================================

# ------------------------------------------------------------------------------
# Storage Account
# -----------------------------------------------------------------------------

resource "azurerm_storage_account" "main" {
  name                     = local.storage_account_name
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  account_kind             = "StorageV2"

  # Allow public access for the static website and uploads (read-only)
  allow_nested_items_to_be_public = true

  tags = local.common_tags
}

# ------------------------------------------------------------------------------
# Static Website (AzureRM v5: separate resource, no longer inline block)
# Serves the React SPA — SPA routing: all routes → index.html
# ------------------------------------------------------------------------------

resource "azurerm_storage_account_static_website" "main" {
  storage_account_id = azurerm_storage_account.main.id
  index_document     = "index.html"
  error_404_document = "index.html"
}

# ------------------------------------------------------------------------------
# Blob Container: uploads (for book cover images)
# ------------------------------------------------------------------------------

resource "azurerm_storage_container" "uploads" {
  name                  = "uploads"
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = "blob" # Public read for individual blobs (images)
}

# ------------------------------------------------------------------------------
# Private Endpoint — Blob Storage
# Backend → Blob writes stay on the Azure backbone
# ------------------------------------------------------------------------------

resource "azurerm_private_endpoint" "blob" {
  name                = "${local.name_prefix}-pe-blob"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  subnet_id           = azurerm_subnet.private_endpoints.id
  tags                = local.common_tags

  private_service_connection {
    name                           = "${local.name_prefix}-psc-blob"
    private_connection_resource_id = azurerm_storage_account.main.id
    is_manual_connection           = false
    subresource_names              = ["blob"]
  }

  private_dns_zone_group {
    name                 = "blob-dns-zone-group"
    private_dns_zone_ids = [azurerm_private_dns_zone.blob.id]
  }
}

# ------------------------------------------------------------------------------
# Private DNS Zone — Blob Storage
# ------------------------------------------------------------------------------

resource "azurerm_private_dns_zone" "blob" {
  name                = "privatelink.blob.core.windows.net"
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags
}

resource "azurerm_private_dns_zone_virtual_network_link" "blob" {
  name                = "${local.name_prefix}-dns-blob"
  private_dns_zone_id = azurerm_private_dns_zone.blob.id
  virtual_network_id  = azurerm_virtual_network.main.id
  registration_enabled = false
}
