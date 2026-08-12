# ============================================================
# BookManager – Input Variables
# ============================================================
# All secrets and sensitive values must be placed in
# terraform.tfvars (which is gitignored). 
# Never hardcode secrets in .tf files.
# ============================================================

# ─── Azure Identity ──────────────────────────────────────────

variable "subscription_id" {
  description = <<-EOT
    Your Azure Subscription ID.
    Find it: az account show --query id -o tsv
  EOT
  type        = string
}

variable "tenant_id" {
  description = <<-EOT
    Your Azure Tenant (Directory) ID.
    Find it: az account show --query tenantId -o tsv
  EOT
  type        = string
}

# ─── Project Meta ────────────────────────────────────────────

variable "project_name" {
  description = "Short name used as a prefix in all resource names."
  type        = string
  default     = "bookmanager"
}

variable "environment" {
  description = "Deployment environment: prod | staging | dev"
  type        = string
  default     = "prod"
}

variable "location" {
  description = <<-EOT
    Azure region. 
    Examples: francecentral | westeurope | northeurope | eastus
    IMPORTANT: Choose once — changing this destroys and recreates resources.
  EOT
  type        = string
  default     = "westeurope"
}

# ─── Networking ──────────────────────────────────────────────

variable "vnet_address_space" {
  description = "CIDR block for the Virtual Network."
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_prefix" {
  description = "CIDR for the public subnet (Application Gateway)."
  type        = string
  default     = "10.0.1.0/24"
}

variable "app_subnet_prefix" {
  description = "CIDR for the private app subnet (VM Scale Set)."
  type        = string
  default     = "10.0.2.0/24"
}

# bastion_subnet_prefix removed — Bastion replaced by direct SSH in dev/staging

# ─── Compute ─────────────────────────────────────────────────

variable "vm_size" {
  description = <<-EOT
    Azure VM size for the Scale Set instances.
    Cost guide (francecentral, Linux):
      Standard_B1s  = ~$8/mo  per instance (1 vCPU, 1 GB) — dev only
      Standard_B2s  = ~$35/mo per instance (2 vCPU, 4 GB) — recommended
      Standard_B2ms = ~$60/mo per instance (2 vCPU, 8 GB) — production
  EOT
  type        = string
  default     = "Standard_B1s"
}

# vmss_instance_count, vmss_min_count, vmss_max_count removed — single VM in dev/staging

variable "admin_username" {
  description = "Linux admin username on the VMs. Avoid 'admin' or 'root'."
  type        = string
  default     = "bookmanager"
}

variable "ssh_public_key" {
  description = <<-EOT
    SSH public key content (the full line from ~/.ssh/id_ed25519.pub).
    Generate: ssh-keygen -t ed25519 -C "bookmanager-azure"
  EOT
  type        = string
  sensitive   = true
}

variable "os_disk_size_gb" {
  description = "OS disk size in GB per VM instance."
  type        = number
  default     = 30
}

# ─── Container Registry ──────────────────────────────────────

variable "acr_sku" {
  description = <<-EOT
    Azure Container Registry SKU.
    Basic  = $5/mo  — no geo-replication, no VNet integration
    Standard = $20/mo — recommended for production
    Premium  = $50/mo — geo-replication, private endpoint
  EOT
  type        = string
  default     = "Basic"
}

# ─── Application Secrets (injected into VMs via Key Vault) ───

variable "mongodb_uri" {
  description = "MongoDB Atlas connection URI. Stored in Key Vault, never in plaintext on disk."
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret. Generate: openssl rand -hex 64"
  type        = string
  sensitive   = true
}

# dockerhub_username removed — images are pulled from ACR, not Docker Hub

variable "image_tag" {
  description = "Docker image tag to deploy (e.g. 'latest' or a specific version tag)."
  type        = string
  default     = "latest"
}

# ─── SSH Access ──────────────────────────────────────────────

variable "allowed_ssh_cidr" {
  description = <<-EOT
    CIDR that is allowed to SSH into the VM (port 22).
    Best practice: set to your own IP — run: curl ifconfig.me
    Example: "203.0.113.42/32"
    For open dev access (less secure): "*"
  EOT
  type        = string
  default     = "*"  # Change to your IP for better security!
}

# ─── Storage ─────────────────────────────────────────────────

variable "storage_replication" {
  description = <<-EOT
    Storage account replication type.
    LRS = Locally Redundant Storage (3 copies, same datacenter) — cheapest
    GRS = Geo-Redundant Storage (6 copies, 2 regions) — more resilient
  EOT
  type        = string
  default     = "LRS"
}

# ─── Monitoring ──────────────────────────────────────────────

variable "log_retention_days" {
  description = "Number of days to retain logs in Log Analytics Workspace (30 is free)."
  type        = number
  default     = 30
}

variable "alert_email" {
  description = "Email address to receive Azure Monitor alerts."
  type        = string
  default     = ""
}

# ─── Tags ────────────────────────────────────────────────────

variable "common_tags" {
  description = "Tags applied to every Azure resource for cost tracking and organization."
  type        = map(string)
  default = {
    Project     = "bookmanager"
    ManagedBy   = "Terraform"
    Environment = "prod"
    Owner       = "DevOps"
  }
}
