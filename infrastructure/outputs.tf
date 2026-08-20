# ==============================================================================
# BookManager — Outputs
# ==============================================================================
# Key values needed after deployment:
#   - URLs to access frontend and backend
#   - ACR login server for CI/CD image pushes
#   - Connection strings (sensitive) for debugging
# ==============================================================================

# ------------------------------------------------------------------------------
# Application URLs
# ------------------------------------------------------------------------------

output "backend_url" {
  description = "Backend API URL (Container App FQDN)"
  value       = "https://${azurerm_container_app.backend.ingress[0].fqdn}"
}

output "frontend_url" {
  description = "Frontend URL (Blob Storage static website)"
  value       = azurerm_storage_account.main.primary_web_endpoint
}

output "uploads_url" {
  description = "Base URL for uploaded files (book cover images)"
  value       = "${azurerm_storage_account.main.primary_blob_endpoint}uploads/"
}

# ------------------------------------------------------------------------------
# Container Registry
# ------------------------------------------------------------------------------

output "acr_login_server" {
  description = "ACR login server URL — used in CI/CD to push images"
  value       = azurerm_container_registry.main.login_server
}

output "acr_admin_username" {
  description = "ACR admin username (for initial setup only)"
  value       = azurerm_container_registry.main.admin_username
  sensitive   = true
}

output "acr_admin_password" {
  description = "ACR admin password (for initial setup only)"
  value       = azurerm_container_registry.main.admin_password
  sensitive   = true
}

# ------------------------------------------------------------------------------
# Resource IDs (for CI/CD and debugging)
# ------------------------------------------------------------------------------

output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.main.name
}

output "container_app_name" {
  description = "Container App name — used in CI/CD deployment commands"
  value       = azurerm_container_app.backend.name
}

output "storage_account_name" {
  description = "Storage Account name — used for frontend deployment"
  value       = azurerm_storage_account.main.name
}

output "key_vault_name" {
  description = "Key Vault name"
  value       = azurerm_key_vault.main.name
}

# ------------------------------------------------------------------------------
# MongoDB Atlas (sensitive — for debugging only)
# ------------------------------------------------------------------------------

output "mongodb_uri" {
  description = "MongoDB Atlas connection string (from Key Vault)"
  value       = var.mongodb_uri
  sensitive   = true
}
