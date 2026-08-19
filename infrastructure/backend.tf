terraform {
    backend "azurerm" {
    resource_group_name  = "tfstate-l02"
    storage_account_name = "l0220004"
    container_name       = "tfstate"
    key                  = "terraform.tfstate"
  }
}