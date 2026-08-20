# ==============================================================================
# BookManager — Azure Container Registry (ACR)
# ==============================================================================
# Private Docker registry for backend and frontend images.
# Replaces DockerHub — images stay within Azure for faster pulls
# and native integration with Container Apps via managed identity.
# ==============================================================================

resource "azurerm_container_registry" "main" {
  name                = local.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Basic"
  admin_enabled       = true
  tags                = local.common_tags
}
