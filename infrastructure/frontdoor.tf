# ==============================================================================
# BookManager — Azure Front Door (CDN + WAF)
# ==============================================================================
# PHASE 2 — Optional. Uncomment when ready to add global CDN.
#
# Front Door provides:
#   - Global edge caching for static assets (React SPA)
#   - SSL termination and custom domain support
#   - URL-based routing: /api/* → Backend, /* → Static Website
#   - WAF (Web Application Firewall) for DDoS protection
#   - SPA routing: rewrites 404s to /index.html
#
# Cost: ~$35/month (Standard_AzureFrontDoor tier)
#
# Without Front Door, users access:
#   - Frontend: directly via Blob Storage static website URL
#   - Backend: directly via Container App FQDN
# ==============================================================================

# resource "azurerm_cdn_frontdoor_profile" "main" {
#   name                = "${local.name_prefix}-fd"
#   resource_group_name = azurerm_resource_group.main.name
#   sku_name            = "Standard_AzureFrontDoor"
#   tags                = local.common_tags
# }

# # --- Origin Group: Static Website (React SPA) ---
# resource "azurerm_cdn_frontdoor_origin_group" "frontend" {
#   name                     = "frontend-origin-group"
#   cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
#   session_affinity_enabled = false
#
#   load_balancing {
#     sample_size                 = 4
#     successful_samples_required = 3
#   }
#
#   health_probe {
#     path                = "/"
#     request_type        = "HEAD"
#     protocol            = "Https"
#     interval_in_seconds = 60
#   }
# }
#
# resource "azurerm_cdn_frontdoor_origin" "frontend" {
#   name                          = "frontend-blob-origin"
#   cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.frontend.id
#   enabled                       = true
#
#   certificate_name_check_enabled = true
#   host_name                      = azurerm_storage_account.main.primary_web_host
#   origin_host_header             = azurerm_storage_account.main.primary_web_host
#   http_port                      = 80
#   https_port                     = 443
# }
#
# # --- Origin Group: Backend API (Container App) ---
# resource "azurerm_cdn_frontdoor_origin_group" "backend" {
#   name                     = "backend-origin-group"
#   cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
#   session_affinity_enabled = false
#
#   load_balancing {
#     sample_size                 = 4
#     successful_samples_required = 3
#   }
#
#   health_probe {
#     path                = "/api"
#     request_type        = "GET"
#     protocol            = "Https"
#     interval_in_seconds = 30
#   }
# }
#
# resource "azurerm_cdn_frontdoor_origin" "backend" {
#   name                          = "backend-container-app-origin"
#   cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.backend.id
#   enabled                       = true
#
#   certificate_name_check_enabled = true
#   host_name                      = azurerm_container_app.backend.ingress[0].fqdn
#   origin_host_header             = azurerm_container_app.backend.ingress[0].fqdn
#   http_port                      = 80
#   https_port                     = 443
# }
#
# # --- Endpoint ---
# resource "azurerm_cdn_frontdoor_endpoint" "main" {
#   name                     = "${local.name_prefix}-endpoint"
#   cdn_frontdoor_profile_id = azurerm_cdn_frontdoor_profile.main.id
#   tags                     = local.common_tags
# }
#
# # --- Route: /api/* → Backend ---
# resource "azurerm_cdn_frontdoor_route" "api" {
#   name                          = "api-route"
#   cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.main.id
#   cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.backend.id
#   cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.backend.id]
#
#   supported_protocols = ["Https"]
#   patterns_to_match   = ["/api/*"]
#   forwarding_protocol = "HttpsOnly"
#
#   cache {
#     query_string_caching_behavior = "IgnoreQueryString"
#   }
# }
#
# # --- Route: /* → Frontend Static Website ---
# resource "azurerm_cdn_frontdoor_route" "frontend" {
#   name                          = "frontend-route"
#   cdn_frontdoor_endpoint_id     = azurerm_cdn_frontdoor_endpoint.main.id
#   cdn_frontdoor_origin_group_id = azurerm_cdn_frontdoor_origin_group.frontend.id
#   cdn_frontdoor_origin_ids      = [azurerm_cdn_frontdoor_origin.frontend.id]
#
#   supported_protocols = ["Https"]
#   patterns_to_match   = ["/*"]
#   forwarding_protocol = "HttpsOnly"
#
#   cache {
#     query_string_caching_behavior = "IgnoreQueryString"
#     compression_enabled           = true
#     content_types_to_compress     = [
#       "text/html",
#       "text/css",
#       "application/javascript",
#       "application/json",
#       "image/svg+xml",
#     ]
#   }
# }
