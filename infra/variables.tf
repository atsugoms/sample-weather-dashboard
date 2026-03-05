variable "prefix" {
  description = "Prefix used for all resource names"
  type        = string
  default     = "weather-dashboard"
}

variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "rg-weather-dashboard"
}

variable "location" {
  description = "Azure region for all resources"
  type        = string
  default     = "japaneast"
}

variable "acr_name" {
  description = "Name of the Azure Container Registry (must be globally unique, alphanumeric only)"
  type        = string
  default     = "weatherdashboardacr"
}

variable "key_vault_name" {
  description = "Name of the Azure Key Vault (must be globally unique, 3-24 characters)"
  type        = string
  default     = "weather-dashboard-kv"
}

variable "image_name" {
  description = "Container image name in the registry"
  type        = string
  default     = "weather-dashboard"
}

variable "image_tag" {
  description = "Container image tag"
  type        = string
  default     = "latest"
}

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    project     = "weather-dashboard"
    environment = "production"
    managed_by  = "terraform"
  }
}
