# ==============================================================================
# BookManager — Azure Container Apps (Backend)
# ==============================================================================
# Runs the NestJS backend as a managed container.
#
# Architecture:
#   Container App Environment (VNet-integrated)
#     └── Container App: bookmanager-backend
#           ├── Image: from ACR
#           ├── Secrets: from Key Vault (via managed identity)
#           ├── Ingress: external HTTPS on port 3000
#           ├── Scaling: 1-5 replicas, HTTP-based
#           └── Health: liveness + readiness probes on /api
#
# Why Container Apps over AKS:
#   - No cluster management, node pools, or Helm charts
#   - Built-in HTTPS ingress (no Ingress controller needed)
#   - Serverless billing: pay per vCPU-second
#   - Native ACR + Key Vault integration via managed identity
# ==============================================================================

# ------------------------------------------------------------------------------
# Container Apps Environment
# Linked to VNet subnet and Log Analytics for centralized logging
# ------------------------------------------------------------------------------

resource "azurerm_container_app_environment" "main" {
  name                       = local.container_app_env_name
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  logs_destination            = "log-analytics"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  infrastructure_subnet_id = azurerm_subnet.container_apps.id

  tags = local.common_tags
}

# ------------------------------------------------------------------------------
# User-Assigned Managed Identity
# Used by the Container App to:
#   - Pull images from ACR (AcrPull role)
#   - Read secrets from Key Vault (Key Vault Secrets User role)
# ------------------------------------------------------------------------------

resource "azurerm_user_assigned_identity" "backend" {
  name                = "${local.name_prefix}-id-backend"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags
}

# Grant: Pull images from ACR
resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.main.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.backend.principal_id
}

# Grant: Read secrets from Key Vault
resource "azurerm_role_assignment" "kv_secrets_user" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.backend.principal_id
}

# ------------------------------------------------------------------------------
# Container App: Backend (NestJS)
# ------------------------------------------------------------------------------

resource "azurerm_container_app" "backend" {
  name                         = local.container_app_backend_name
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"
  tags                         = local.common_tags

  # Managed Identity for ACR + Key Vault access
  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.backend.id]
  }

  # ACR image pull configuration
  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.backend.id
  }

  # --------------------------------------------------------------------------
  # Secrets — referenced from Key Vault via managed identity
  # --------------------------------------------------------------------------

  secret {
    name                = "mongodb-uri"
    key_vault_secret_id = azurerm_key_vault_secret.mongodb_uri.id
    identity            = azurerm_user_assigned_identity.backend.id
  }

  secret {
    name                = "jwt-secret"
    key_vault_secret_id = azurerm_key_vault_secret.jwt_secret.id
    identity            = azurerm_user_assigned_identity.backend.id
  }

  secret {
    name                = "blob-connection-string"
    key_vault_secret_id = azurerm_key_vault_secret.blob_connection_string.id
    identity            = azurerm_user_assigned_identity.backend.id
  }

  # --------------------------------------------------------------------------
  # Ingress — external HTTPS access
  # --------------------------------------------------------------------------

  ingress {
    external_enabled = true
    target_port      = var.backend_port
    transport        = "auto"

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  # --------------------------------------------------------------------------
  # Container template
  # --------------------------------------------------------------------------

  template {
    min_replicas = var.backend_min_replicas
    max_replicas = var.backend_max_replicas

    container {
      name   = "bookmanager-backend"
      image  = "${azurerm_container_registry.main.login_server}/bookmanager-backend:latest"
      cpu    = var.backend_container_cpu
      memory = var.backend_container_memory

      # Environment variables (non-sensitive)
      env {
        name  = "PORT"
        value = tostring(var.backend_port)
      }

      env {
        name  = "JWT_EXPIRATION"
        value = var.jwt_expiration
      }

      env {
        name  = "CORS_ORIGIN"
        value = "https://bookmanagerstagingsa.z6.web.core.windows.net"
      }

      env {
        name  = "AZURE_STORAGE_ACCOUNT_NAME"
        value = azurerm_storage_account.main.name
      }

      env {
        name  = "AZURE_STORAGE_CONTAINER_NAME"
        value = azurerm_storage_container.uploads.name
      }

      # Environment variables (from Key Vault secrets)
      env {
        name       = "MONGODB_URI"
        secret_name = "mongodb-uri"
      }

      env {
        name       = "JWT_SECRET"
        secret_name = "jwt-secret"
      }

      env {
        name       = "AZURE_STORAGE_CONNECTION_STRING"
        secret_name = "blob-connection-string"
      }

      # Liveness probe — is the container alive?
      liveness_probe {
        transport = "HTTP"
        port      = var.backend_port
        path      = "/health"

        initial_delay    = 10
        interval_seconds = 30
        timeout          = 5
        failure_count_threshold = 3
      }

      # Readiness probe — is the container ready to receive traffic?
      readiness_probe {
        transport = "HTTP"
        port      = var.backend_port
        path      = "/health"

        interval_seconds = 10
        timeout          = 5
        failure_count_threshold = 3
      }
    }

    # HTTP scaling rule: scale up when concurrent requests exceed 50/replica
    http_scale_rule {
      name                = "http-scaling"
      concurrent_requests = "50"
    }
  }

  depends_on = [
    azurerm_role_assignment.acr_pull,
    azurerm_role_assignment.kv_secrets_user,
  ]
}
