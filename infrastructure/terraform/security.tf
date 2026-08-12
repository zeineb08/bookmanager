# ============================================================
# BookManager – Security (NSG + Key Vault)
# ============================================================
#
# DEV/STAGING NSG RULES (simplified from production):
#
#   Production had:
#     - Public NSG for Application Gateway subnet (ports 80/443/65200-65535)
#     - App NSG for VMSS (only allowed traffic FROM AppGW subnet)
#     - Bastion for SSH (never exposed port 22 to internet)
#
#   Dev/Staging has:
#     - One NSG attached directly to the VM's NIC
#     - Port 3000 (NestJS API) open from internet
#     - Port 8080 (React frontend) open from internet
#     - Port 22 (SSH) open from var.allowed_ssh_cidr only
#       → Set this to your IP: curl ifconfig.me
#       → Or use "*" for open access (less secure, only for dev)
#
# Key Vault is unchanged from production — secrets handling stays secure.
# ============================================================

# ─── NSG: VM NIC ─────────────────────────────────────────────
resource "azurerm_network_security_group" "vm" {
  name                = "${local.name_prefix}-vm-nsg"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags

  # ── Allow NestJS backend API ──────────────────────────────
  security_rule {
    name                       = "allow-backend"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "3000"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
    description                = "Allow HTTP traffic to NestJS API"
  }

  # ── Allow React frontend ──────────────────────────────────
  security_rule {
    name                       = "allow-frontend"
    priority                   = 110
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "8080"
    source_address_prefix      = "Internet"
    destination_address_prefix = "*"
    description                = "Allow HTTP traffic to React frontend"
  }

  # ── Allow SSH (restricted to your IP) ─────────────────────
  # Set var.allowed_ssh_cidr to your IP (e.g. "203.0.113.42/32")
  # for better security, or leave as "*" for open dev access.
  security_rule {
    name                       = "allow-ssh"
    priority                   = 120
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "22"
    source_address_prefix      = var.allowed_ssh_cidr
    destination_address_prefix = "*"
    description                = "Allow SSH from allowed CIDR (set to your IP for security)"
  }

  # ── Allow Azure health probes ─────────────────────────────
  security_rule {
    name                       = "allow-azure-loadbalancer"
    priority                   = 130
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "AzureLoadBalancer"
    destination_address_prefix = "*"
    description                = "Allow Azure infrastructure health probes"
  }

  # ── Deny everything else ──────────────────────────────────
  security_rule {
    name                       = "deny-all-inbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
    description                = "Explicit deny-all (defense in depth)"
  }
}

# ─── Azure Key Vault ──────────────────────────────────────────
# Unchanged from production — secrets management stays secure
# regardless of environment.

data "azurerm_client_config" "current" {}

resource "azurerm_key_vault" "main" {
  name                = "${var.project_name}kv${local.unique_suffix}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku_name            = "standard"
  tenant_id           = var.tenant_id

  soft_delete_retention_days = 90
  purge_protection_enabled   = false

  enable_rbac_authorization = true

  tags = local.tags
}

# Grant the Terraform executor admin rights to create secrets
resource "azurerm_role_assignment" "keyvault_admin" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Administrator"
  principal_id         = data.azurerm_client_config.current.object_id
}

# ─── Secrets ──────────────────────────────────────────────────
resource "azurerm_key_vault_secret" "mongodb_uri" {
  name         = "mongodb-uri"
  value        = var.mongodb_uri
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.keyvault_admin]
}

resource "azurerm_key_vault_secret" "jwt_secret" {
  name         = "jwt-secret"
  value        = var.jwt_secret
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.keyvault_admin]
}
