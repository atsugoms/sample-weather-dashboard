output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.rg.name
}

output "acr_login_server" {
  description = "Login server URL of the Container Registry"
  value       = azurerm_container_registry.acr.login_server
}

output "key_vault_uri" {
  description = "URI of the Key Vault"
  value       = azurerm_key_vault.kv.vault_uri
}

output "container_app_url" {
  description = "Public URL of the Container App"
  value       = "https://${azurerm_container_app.dashboard.ingress[0].fqdn}"
}

output "log_analytics_workspace_id" {
  description = "ID of the Log Analytics Workspace"
  value       = azurerm_log_analytics_workspace.law.id
}
