# ============================================================
# BookManager – Terraform Outputs (Dev/Staging)
# ============================================================
# Run `terraform output` after apply to see all values.
# Use `terraform output -raw <name>` to get raw values for scripts.
# ============================================================

# ─── Resource Group ──────────────────────────────────────────
output "resource_group_name" {
  description = "Name of the Azure Resource Group containing all resources"
  value       = azurerm_resource_group.main.name
}

# ─── VM Access ───────────────────────────────────────────────
output "vm_public_ip" {
  description = "Public IP of the VM — your app's entry point and SSH target"
  value       = azurerm_public_ip.vm.ip_address
}

output "ssh_command" {
  description = "SSH command to connect to the VM"
  value       = "ssh ${var.admin_username}@${azurerm_public_ip.vm.ip_address}"
}

output "application_url" {
  description = "React frontend URL"
  value       = "http://${azurerm_public_ip.vm.ip_address}:8080"
}

output "api_url" {
  description = "NestJS API base URL"
  value       = "http://${azurerm_public_ip.vm.ip_address}:3000/api"
}

output "swagger_url" {
  description = "Swagger/OpenAPI documentation"
  value       = "http://${azurerm_public_ip.vm.ip_address}:3000/api/docs"
}

# ─── Networking ──────────────────────────────────────────────
output "vnet_id" {
  description = "Azure Virtual Network resource ID"
  value       = azurerm_virtual_network.main.id
}

output "app_subnet_id" {
  description = "App subnet ID (VM lives here)"
  value       = azurerm_subnet.app.id
}

# ─── Container Registry ──────────────────────────────────────
output "acr_login_server" {
  description = "ACR login server URL — use in CI/CD: docker push <acr_login_server>/bookmanager-backend:tag"
  value       = azurerm_container_registry.acr.login_server
}

output "acr_name" {
  description = "ACR resource name (for: az acr login --name <acr_name>)"
  value       = azurerm_container_registry.acr.name
}

# ─── VM ──────────────────────────────────────────────────────
output "vm_id" {
  description = "VM resource ID"
  value       = azurerm_linux_virtual_machine.app.id
}

output "vm_name" {
  description = "VM resource name"
  value       = azurerm_linux_virtual_machine.app.name
}

# ─── Storage ─────────────────────────────────────────────────
output "storage_account_name" {
  description = "Azure Storage Account name"
  value       = azurerm_storage_account.main.name
}

output "storage_account_primary_endpoint" {
  description = "Primary Blob endpoint URL for the storage account"
  value       = azurerm_storage_account.main.primary_blob_endpoint
}

# ─── Key Vault ───────────────────────────────────────────────
output "key_vault_uri" {
  description = "Key Vault URI (used by the VM to fetch secrets)"
  value       = azurerm_key_vault.main.vault_uri
}

output "key_vault_name" {
  description = "Key Vault resource name"
  value       = azurerm_key_vault.main.name
}

# ─── Monitoring ──────────────────────────────────────────────
output "log_analytics_workspace_id" {
  description = "Log Analytics Workspace resource ID"
  value       = azurerm_log_analytics_workspace.main.id
}

output "application_insights_connection_string" {
  description = "Application Insights connection string (injected into NestJS .env via Key Vault)"
  value       = azurerm_application_insights.main.connection_string
  sensitive   = true
}

output "application_insights_instrumentation_key" {
  description = "Application Insights instrumentation key"
  value       = azurerm_application_insights.main.instrumentation_key
  sensitive   = true
}

# ─── Managed Identity ────────────────────────────────────────
output "managed_identity_client_id" {
  description = "Client ID of the User-Assigned Managed Identity"
  value       = azurerm_user_assigned_identity.app.client_id
}

# ─── CI/CD Helper Outputs ────────────────────────────────────
output "github_actions_secrets" {
  description = "Values to add as GitHub Actions secrets for CI/CD"
  value = {
    ACR_LOGIN_SERVER     = azurerm_container_registry.acr.login_server
    ACR_NAME             = azurerm_container_registry.acr.name
    AZURE_RESOURCE_GROUP = azurerm_resource_group.main.name
    VM_NAME              = azurerm_linux_virtual_machine.app.name
    VM_PUBLIC_IP         = azurerm_public_ip.vm.ip_address
    KEY_VAULT_NAME       = azurerm_key_vault.main.name
    STORAGE_ACCOUNT_NAME = azurerm_storage_account.main.name
  }
}

# ─── Verification Commands ───────────────────────────────────
output "verify_commands" {
  description = "Useful commands to verify deployment after terraform apply"
  value       = <<-EOT
    # 1. List all resources in the resource group
    az resource list --resource-group ${azurerm_resource_group.main.name} -o table

    # 2. SSH into the VM
    ssh ${var.admin_username}@${azurerm_public_ip.vm.ip_address}

    # 3. Test the frontend
    curl http://${azurerm_public_ip.vm.ip_address}:8080

    # 4. Test the API health endpoint
    curl http://${azurerm_public_ip.vm.ip_address}:3000/api/health

    # 5. Check docker containers on the VM
    ssh ${var.admin_username}@${azurerm_public_ip.vm.ip_address} 'docker compose -f /opt/bookmanager/docker-compose.yml ps'

    # 6. View cloud-init boot log (troubleshooting)
    ssh ${var.admin_username}@${azurerm_public_ip.vm.ip_address} 'sudo cat /var/log/cloud-init-output.log'

    # 7. List ACR images
    az acr repository list --name ${azurerm_container_registry.acr.name} -o table

    # 8. View Key Vault secrets
    az keyvault secret list --vault-name ${azurerm_key_vault.main.name} -o table
  EOT
}
