# ============================================================
# BookManager – Main Entry Point
# ============================================================
# Contains: Resource Group, local values, data sources, and
# the User-Assigned Managed Identity (used by VMs to pull
# images from ACR and read secrets from Key Vault without
# any stored credentials).
# ============================================================

# ─── Random suffix for globally-unique names ─────────────────
# Storage accounts and ACR names must be globally unique across
# all Azure tenants. We append a random 4-char hex suffix.
resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  # Short name used everywhere — e.g. "bookmanager-prod"
  name_prefix = "${var.project_name}-${var.environment}"

  # Globally unique name safe for storage accounts (lowercase, no hyphens, max 24 chars)
  unique_suffix = lower(random_id.suffix.hex)

  # All resources share these tags
  tags = merge(var.common_tags, {
    Environment = var.environment
    Location    = var.location
  })
}

# ─── Resource Group ──────────────────────────────────────────
# A Resource Group is a logical container for all Azure resources
# in this project. Deleting the RG deletes everything inside it.
# Think of it as the Azure equivalent of a project folder.
resource "azurerm_resource_group" "main" {
  name     = "${local.name_prefix}-rg"
  location = var.location
  tags     = local.tags
}

# ─── User-Assigned Managed Identity ──────────────────────────
# WHY MANAGED IDENTITIES?
# Traditional approach: store credentials (username/password, API keys)
# in environment variables or config files on the VM. This is insecure.
#
# Better approach: Managed Identity = Azure automatically issues and
# rotates credentials for the VM. No secrets stored anywhere.
# The VM can then:
#   - Pull Docker images from ACR (instead of docker login)
#   - Read secrets from Key Vault
#   - Write logs to Log Analytics
# All without a single password being written anywhere.
resource "azurerm_user_assigned_identity" "app" {
  name                = "${local.name_prefix}-identity"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags
}

# ─── Role Assignments (RBAC) ─────────────────────────────────
# Grant the Managed Identity exactly the permissions it needs.
# This is the "Least Privilege" principle — no more, no less.

# ACR Pull: VMs can pull (download) images, but not push (upload)
resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.acr.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

# Key Vault Secrets Reader: VMs can read secrets, but not create/delete them
resource "azurerm_role_assignment" "keyvault_reader" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

# Storage Blob Contributor: VMs can read/write files to Blob Storage
resource "azurerm_role_assignment" "storage_contributor" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}

# Monitoring Metrics Publisher: VMs can send custom metrics to Azure Monitor
resource "azurerm_role_assignment" "monitoring_publisher" {
  scope                = azurerm_resource_group.main.id
  role_definition_name = "Monitoring Metrics Publisher"
  principal_id         = azurerm_user_assigned_identity.app.principal_id
}
