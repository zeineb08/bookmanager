# ==============================================================================
# BookManager — Networking (VNet, Subnets, NSG)
# ==============================================================================
# Virtual Network with two subnets:
#   1. Container Apps subnet (/23 — required minimum for Container Apps)
#   2. Private Endpoints subnet (/24 — for Cosmos DB and Blob Storage)
#
# The Container Apps backend communicates with Cosmos DB and Blob Storage
# through Private Endpoints, keeping traffic on the Azure backbone.
# ==============================================================================

# ------------------------------------------------------------------------------
# Virtual Network
# ------------------------------------------------------------------------------

resource "azurerm_virtual_network" "main" {
  name                = local.vnet_name
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  address_space       = ["10.0.0.0/16"]
  tags                = local.common_tags
}

# ------------------------------------------------------------------------------
# Subnet: Container Apps Environment
# Container Apps requires a dedicated subnet with minimum /23 CIDR
# This subnet is delegated to Microsoft.App/environments
# ------------------------------------------------------------------------------

resource "azurerm_subnet" "container_apps" {
  name                 = "snet-container-apps"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.0.0/23"]

  delegation {
    name = "container-apps-delegation"

    service_delegation {
      name    = "Microsoft.App/environments"
      actions = ["Microsoft.Network/virtualNetworks/subnets/join/action"]
    }
  }
}

# ------------------------------------------------------------------------------
# Subnet: Private Endpoints
# Hosts private endpoints for Cosmos DB and Blob Storage
# ------------------------------------------------------------------------------

resource "azurerm_subnet" "private_endpoints" {
  name                              = "snet-private-endpoints"
  resource_group_name               = azurerm_resource_group.main.name
  virtual_network_name              = azurerm_virtual_network.main.name
  address_prefixes                  = ["10.0.2.0/24"]
  private_endpoint_network_policies = "Enabled"
}

# ------------------------------------------------------------------------------
# Network Security Group: Private Endpoints subnet
# Default deny + allow traffic from Container Apps subnet only
# ------------------------------------------------------------------------------

resource "azurerm_network_security_group" "private_endpoints" {
  name                = "${local.name_prefix}-nsg-pe"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.common_tags

  # Allow inbound from Container Apps subnet to Private Endpoints
  security_rule {
    name                       = "AllowContainerAppsInbound"
    priority                   = 100
    direction                  = "Inbound"
    access                     = "Allow"
    protocol                   = "Tcp"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "10.0.0.0/23"
    destination_address_prefix = "10.0.2.0/24"
  }

  # Deny all other inbound
  security_rule {
    name                       = "DenyAllInbound"
    priority                   = 4096
    direction                  = "Inbound"
    access                     = "Deny"
    protocol                   = "*"
    source_port_range          = "*"
    destination_port_range     = "*"
    source_address_prefix      = "*"
    destination_address_prefix = "*"
  }
}

resource "azurerm_subnet_network_security_group_association" "private_endpoints" {
  subnet_id                 = azurerm_subnet.private_endpoints.id
  network_security_group_id = azurerm_network_security_group.private_endpoints.id
}
