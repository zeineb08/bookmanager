# ==============================================================================
# BookManager — Input Variables
# ==============================================================================
# All configurable parameters for the infrastructure.
# Sensitive values should be passed via TF_VAR_* environment variables or .tfvars
# ==============================================================================

# ------------------------------------------------------------------------------
# General
# ------------------------------------------------------------------------------

variable "project_name" {
  description = "The project name used in resource naming"
  type        = string
  default     = "bookmanager"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "staging"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "westeurope"
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# ------------------------------------------------------------------------------
# Container App — Backend
# ------------------------------------------------------------------------------

variable "backend_container_cpu" {
  description = "CPU allocation for the backend container (in vCPU cores)"
  type        = number
  default     = 0.5
}

variable "backend_container_memory" {
  description = "Memory allocation for the backend container (e.g., '1Gi')"
  type        = string
  default     = "1Gi"
}

variable "backend_min_replicas" {
  description = "Minimum number of backend replicas"
  type        = number
  default     = 1
}

variable "backend_max_replicas" {
  description = "Maximum number of backend replicas"
  type        = number
  default     = 5
}

variable "backend_port" {
  description = "Port the NestJS backend listens on"
  type        = number
  default     = 3000
}

# ------------------------------------------------------------------------------
# Secrets (sensitive — pass via TF_VAR_* or .tfvars)
# ------------------------------------------------------------------------------

variable "mongodb_uri" {
  description = "MongoDB Atlas connection string (e.g., mongodb+srv://user:pass@cluster.mongodb.net/bookmanager)"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT signing secret for authentication"
  type        = string
  sensitive   = true
}

variable "jwt_expiration" {
  description = "JWT token expiration duration"
  type        = string
  default     = "7d"
}
