# ============================================================
# BookManager – Monitoring (Azure Monitor + App Insights)
# ============================================================
#
# MONITORING STACK OVERVIEW:
# ┌─────────────────────────────────────────────────────────┐
# │                                                          │
# │  Prometheus ──── equivalent to ──── Azure Monitor        │
# │  Grafana    ──── equivalent to ──── Azure Workbooks      │
# │  Alertmanager ── equivalent to ──── Azure Action Groups  │
# │  ELK Stack  ──── equivalent to ──── Log Analytics        │
# │  New Relic APM ─ equivalent to ──── Application Insights │
# │                                                          │
# └─────────────────────────────────────────────────────────┘
#
# WHAT EACH SERVICE DOES:
#
# Log Analytics Workspace:
#   - Central log aggregation for all Azure resources
#   - VMs, App Gateway, Key Vault all send logs here
#   - Query logs with KQL (Kusto Query Language)
#
# Application Insights:
#   - APM (Application Performance Monitoring) for the app itself
#   - Tracks: HTTP request rates, response times, failure rates
#   - Distributed tracing: see exactly which code is slow
#   - User analytics: page views, sessions
#   - The NestJS SDK sends telemetry automatically
#
# Azure Monitor Alerts:
#   - Trigger notifications when metrics cross thresholds
#   - Actions: email, SMS, webhook, auto-remediation
# ============================================================

# ─── Log Analytics Workspace ──────────────────────────────────
# The central log store. All Azure resources ship their logs here.
# You can then query, visualize, and alert on the data.
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${local.name_prefix}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  sku               = "PerGB2018" # Pay-as-you-go (first 5 GB/month is free)
  retention_in_days = var.log_retention_days

  tags = local.tags
}

# ─── Application Insights ─────────────────────────────────────
# Connected to the Log Analytics Workspace.
# The NestJS backend uses the connection string to send:
#   - API request traces (which endpoint, how long, success/fail)
#   - Exception details with stack traces
#   - Custom events and metrics
resource "azurerm_application_insights" "main" {
  name                = "${local.name_prefix}-appinsights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "Node.JS"

  tags = local.tags
}

# ─── Diagnostic Settings ──────────────────────────────────────
# These connect each Azure resource to the Log Analytics Workspace.
# Without this, logs stay in each resource separately and can't
# be correlated or queried centrally.

# AppGW diagnostic setting removed — Application Gateway not present in dev/staging

# Key Vault → Log Analytics (audit log of every secret access)
resource "azurerm_monitor_diagnostic_setting" "keyvault" {
  name                       = "keyvault-diagnostics"
  target_resource_id         = azurerm_key_vault.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  enabled_log {
    category = "AuditEvent"  # Who accessed which secret, when
  }

  metric {
    category = "AllMetrics"
    enabled  = true
  }
}

# ─── Action Group (Alert Notification Target) ─────────────────
# When an alert fires, where does the notification go?
# Action Groups define: email, SMS, webhook, Azure Function, etc.
resource "azurerm_monitor_action_group" "main" {
  name                = "${local.name_prefix}-alerts"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "bm-alerts"  # Max 12 chars

  dynamic "email_receiver" {
    for_each = var.alert_email != "" ? [var.alert_email] : []
    content {
      name          = "email-alert"
      email_address = email_receiver.value
    }
  }

  tags = local.tags
}

# ─── Metric Alerts ────────────────────────────────────────────
# These alert when specific metrics cross thresholds.

# Alert: High CPU usage on the VM
resource "azurerm_monitor_metric_alert" "high_cpu" {
  name                = "${local.name_prefix}-high-cpu"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_linux_virtual_machine.app.id]
  description         = "Alert when average CPU exceeds 85% for 5 minutes"
  severity            = 2  # Warning
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Compute/virtualMachines"
    metric_name      = "Percentage CPU"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 85
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = local.tags
}

# AppGW 5xx alert removed — Application Gateway not present in dev/staging

# Alert: Application Insights — High response time (P95 > 3 seconds)
resource "azurerm_monitor_metric_alert" "slow_response" {
  name                = "${local.name_prefix}-slow-api"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_application_insights.main.id]
  description         = "Alert when API P95 response time exceeds 3 seconds"
  severity            = 2
  frequency           = "PT5M"
  window_size         = "PT15M"

  criteria {
    metric_namespace = "microsoft.insights/components"
    metric_name      = "requests/duration"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 3000  # milliseconds
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = local.tags
}
