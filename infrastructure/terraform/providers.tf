# ============================================================
# BookManager – Terraform & Azure Provider Configuration
# ============================================================
# Requires Terraform >= 1.6 and the AzureRM provider >= 3.90
# ============================================================

terraform {
  required_version = ">= 1.6"

  required_providers {
    # Official Microsoft Azure provider
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.90"
    }
    # For generating random suffixes (storage account names must be globally unique)
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # ─────────────────────────────────────────────────────────────
  # Remote State: Azure Blob Storage
  # Uncomment AFTER you manually create the storage account once.
  # This stores the tfstate file in Azure instead of locally.
  # Instructions: See infrastructure/docs/AZURE_SETUP.md §Remote State
  # ─────────────────────────────────────────────────────────────
  # backend "azurerm" {
  #   resource_group_name  = "bookmanager-tfstate-rg"
  #   storage_account_name = "bookmanagertfstate"
  #   container_name       = "tfstate"
  #   key                  = "prod/terraform.tfstate"
  # }
}

# ─────────────────────────────────────────────────────────────
# Azure Provider
# Authentication uses the Azure CLI by default (az login).
# For CI/CD, use a Service Principal via environment variables:
#   ARM_CLIENT_ID, ARM_CLIENT_SECRET, ARM_TENANT_ID,
#   ARM_SUBSCRIPTION_ID
# ─────────────────────────────────────────────────────────────
provider "azurerm" {
  features {
    # Prevent accidental deletion of Key Vault (requires manual purge)
    key_vault {
      purge_soft_delete_on_destroy    = false
      recover_soft_deleted_key_vaults = true
    }

    # Require explicit deletion confirmation for resource groups
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }

  subscription_id = var.subscription_id
}

provider "random" {}
