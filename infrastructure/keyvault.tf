# ==============================================================================
# BookManager — Azure Key Vault
# ==============================================================================
# Centralized secrets management. Stores:
#   - MONGODB_URI (MongoDB Atlas connection string)
#   - JWT_SECRET  (authentication signing key)
#
# Container Apps references these secrets at runtime via managed identity.
# Secrets never appear in Terraform plan output (marked sensitive).
# ==============================================================================

data "azurerm_client_config" "current" {}

# ------------------------------------------------------------------------------
# Key Vault
# ------------------------------------------------------------------------------

resource "azurerm_key_vault" "main" {
  name                       = local.keyvault_name
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  tenant_id                  = data.azurerm_client_config.current.tenant_id
  sku_name                   = "standard"
  soft_delete_retention_days = 7
  purge_protection_enabled   = false
  rbac_authorization_enabled  = true
  tags                       = local.common_tags
}

# ------------------------------------------------------------------------------
# Grant the Terraform deployer access to manage secrets
# Role: "Key Vault Secrets Officer" — can create/read/update/delete secrets
# ------------------------------------------------------------------------------

resource "azurerm_role_assignment" "kv_secrets_officer" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets Officer"
  principal_id         = data.azurerm_client_config.current.object_id
}

# ------------------------------------------------------------------------------
# Secrets
# ------------------------------------------------------------------------------

resource "azurerm_key_vault_secret" "mongodb_uri" {
  name         = "MONGODB-URI"
  value        = var.mongodb_uri
  key_vault_id = azurerm_key_vault.main.id
  tags         = local.common_tags

  depends_on = [azurerm_role_assignment.kv_secrets_officer]
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "JWT-SECRET"
  value        = var.jwt_secret
  key_vault_id = azurerm_key_vault.main.id
  tags         = local.common_tags

  depends_on = [azurerm_role_assignment.kv_secrets_officer]
}

resource "azurerm_key_vault_secret" "blob_connection_string" {
  name         = "BLOB-CONNECTION-STRING"
  value        = azurerm_storage_account.main.primary_connection_string
  key_vault_id = azurerm_key_vault.main.id
  tags         = local.common_tags

  depends_on = [azurerm_role_assignment.kv_secrets_officer]
}
