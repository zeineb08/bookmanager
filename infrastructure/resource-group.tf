# ==============================================================================
# BookManager — Resource Group
# ==============================================================================
# Single resource group containing all BookManager Azure resources.
# ==============================================================================

resource "azurerm_resource_group" "main" {
  name     = local.resource_group_name
  location = var.location
  tags     = local.common_tags
}
