# ==============================================================================
# BookManager — Monitoring (Log Analytics)
# ==============================================================================
# Log Analytics Workspace collects:
#   - Container App stdout/stderr (your NestJS Logger output)
#   - Container App metrics (CPU, memory, request count, latency)
#   - System logs (container start/stop, scaling events, health probe results)
#
# Your NestJS app already uses Logger — no SDK changes needed.
# Logs are queryable via KQL in Azure Portal or via Azure CLI.
# ==============================================================================

resource "azurerm_log_analytics_workspace" "main" {
  name                = local.log_analytics_workspace_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = local.common_tags
}
