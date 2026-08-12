# ============================================================
# BookManager – Azure Networking (Dev/Staging — lean config)
# ============================================================
#
# ARCHITECTURE:
# ┌─────────────────── Azure Virtual Network (10.0.0.0/16) ──┐
# │                                                            │
# │  app-subnet (10.0.2.0/24)                                  │
# │    └─ Single Linux VM (NestJS + React containers)          │
# │         └─ Public IP attached directly (no AppGW/Bastion)  │
# │                                                            │
# └────────────────────────────────────────────────────────────┘
#
# WHAT WAS REMOVED vs. PRODUCTION CONFIG (and why):
#   ✗ Application Gateway Standard_v2 → ~$180/mo  (overkill for dev)
#   ✗ Azure Bastion Basic             → ~$210/mo  (use SSH directly instead)
#   ✗ NAT Gateway                     → ~$33/mo   (VM has a public IP now)
#   ✗ Public subnet (AppGW only)      → not needed
#   ✗ Bastion subnet                  → not needed
#
# TRADE-OFFS vs. PRODUCTION:
#   - No WAF (Web Application Firewall) — acceptable for dev
#   - No path-based routing (AppGW feature) — nginx in the container handles this
#   - SSH directly on port 22 — restrict via NSG (var.allowed_ssh_cidr)
#   - No HA — single VM goes down during restarts (~2 min)
# ============================================================

# ─── Virtual Network ─────────────────────────────────────────
resource "azurerm_virtual_network" "main" {
  name                = "${local.name_prefix}-vnet"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = [var.vnet_address_space]
  tags                = local.tags
}

# ─── App Subnet ──────────────────────────────────────────────
# Single subnet for the VM. Public IPs are attached directly
# to the VM's NIC (no AppGW in the middle).
resource "azurerm_subnet" "app" {
  name                 = "app-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = [var.app_subnet_prefix]
}

# ─── Public IP for the VM ────────────────────────────────────
# The VM gets a single static public IP for:
#   - Inbound: HTTP (3000/8080) and SSH (22)
#   - Outbound: pulling images from ACR, connecting to MongoDB Atlas
# Static allocation means the IP never changes across VM restarts.
resource "azurerm_public_ip" "vm" {
  name                = "${local.name_prefix}-vm-pip"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  allocation_method   = "Static"
  sku                 = "Standard"
  tags                = local.tags
}
