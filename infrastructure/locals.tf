# ==============================================================================
# BookManager — Local Values
# ==============================================================================
# Computed naming conventions and common tags.
# All resources follow the pattern: {project}-{environment}-{resource_type}
# ==============================================================================

locals {
  # Naming prefix: "bookmanager-prod"
  name_prefix = "${var.project_name}-${var.environment}"

  # Common tags applied to every resource
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    },
    var.tags
  )

  # Resource-specific names
  resource_group_name          = "${local.name_prefix}-rg"
  vnet_name                    = "${local.name_prefix}-vnet"
  acr_name                     = replace("${var.project_name}${var.environment}acr", "-", "")
  keyvault_name                = "${local.name_prefix}-kv"
  storage_account_name         = replace("${var.project_name}${var.environment}sa", "-", "")
  log_analytics_workspace_name = "${local.name_prefix}-law"
  container_app_env_name       = "${local.name_prefix}-cae"
  container_app_backend_name   = "${local.name_prefix}-backend"
}
