# ============================================================
# BookManager – Compute (ACR + Single Linux VM)
# ============================================================
#
# DEV/STAGING CONFIG:
#   Single VM instead of a VM Scale Set.
#   - Simpler to manage, much cheaper (~$35/mo vs ~$70+/mo for VMSS)
#   - No rolling upgrades — restart the VM to update
#   - App goes down for ~2 min on `terraform apply` changes to this file
#
# TO UPGRADE TO PRODUCTION:
#   Replace azurerm_linux_virtual_machine with
#   azurerm_linux_virtual_machine_scale_set + azurerm_application_gateway
# ============================================================

# ─── Azure Container Registry ─────────────────────────────────
# Your private Docker registry. CI/CD pushes images here.
# The VM pulls images using its Managed Identity (no docker login needed).
resource "azurerm_container_registry" "acr" {
  name                = "${var.project_name}acr${local.unique_suffix}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.acr_sku
  admin_enabled       = false  # Use Managed Identity instead (more secure)
  tags                = local.tags
}

# ─── SSH Key stored in Key Vault ─────────────────────────────
resource "azurerm_key_vault_secret" "ssh_public_key" {
  name         = "vmss-ssh-public-key"
  value        = var.ssh_public_key
  key_vault_id = azurerm_key_vault.main.id

  depends_on = [azurerm_role_assignment.keyvault_admin]
}

# ─── Cloud-Init Bootstrap Script ─────────────────────────────
# Runs ONCE on first boot. Installs Docker, fetches secrets from
# Key Vault via Managed Identity, then starts the app.
locals {
  cloud_init_script = <<-SCRIPT
    #cloud-config
    package_update: true
    package_upgrade: true

    packages:
      - docker.io
      - docker-compose-v2
      - curl
      - jq
      - apt-transport-https

    runcmd:
      # Enable Docker
      - systemctl enable docker
      - systemctl start docker
      - usermod -aG docker ${var.admin_username}

      # Install Azure CLI (needed for ACR login via Managed Identity)
      - curl -sL https://aka.ms/InstallAzureCLIDeb | bash

      # Create app directory
      - mkdir -p /opt/bookmanager/uploads

      # ── Fetch secrets from Key Vault using Managed Identity ──
      - |
        TOKEN=$(curl -s -H "Metadata: true" \
          "http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https://vault.azure.net" \
          | jq -r '.access_token')

        VAULT_URL="https://${azurerm_key_vault.main.name}.vault.azure.net"

        MONGODB_URI=$(curl -s -H "Authorization: Bearer $TOKEN" \
          "$VAULT_URL/secrets/mongodb-uri?api-version=7.3" \
          | jq -r '.value')

        JWT_SECRET=$(curl -s -H "Authorization: Bearer $TOKEN" \
          "$VAULT_URL/secrets/jwt-secret?api-version=7.3" \
          | jq -r '.value')

        cat > /opt/bookmanager/.env << EOF
        PORT=3000
        MONGODB_URI=$MONGODB_URI
        JWT_SECRET=$JWT_SECRET
        JWT_EXPIRATION=7d
        CORS_ORIGIN=http://${azurerm_public_ip.vm.ip_address}
        VITE_API_URL=/api
        AZURE_STORAGE_ACCOUNT=${azurerm_storage_account.main.name}
        APPLICATIONINSIGHTS_CONNECTION_STRING=${azurerm_application_insights.main.connection_string}
        EOF

      # ── Login to ACR via Managed Identity ────────────────────
      - az login --identity
      - az acr login --name ${azurerm_container_registry.acr.name}

      # ── Write docker-compose.yml ──────────────────────────────
      # NOTE: Ports bind to 0.0.0.0 (all interfaces) so traffic from
      # outside the VM can reach the containers. NSG controls access.
      - |
        cat > /opt/bookmanager/docker-compose.yml << 'COMPOSE'
        version: "3.9"
        services:
          backend:
            image: ${azurerm_container_registry.acr.login_server}/${var.project_name}-backend:${var.image_tag}
            container_name: bookmanager-backend
            restart: unless-stopped
            ports:
              - "0.0.0.0:3000:3000"
            env_file:
              - /opt/bookmanager/.env
            volumes:
              - /opt/bookmanager/uploads:/app/uploads
            networks:
              - bookmanager-net
            healthcheck:
              test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
              interval: 30s
              timeout: 10s
              retries: 3

          frontend:
            image: ${azurerm_container_registry.acr.login_server}/${var.project_name}-frontend:${var.image_tag}
            container_name: bookmanager-frontend
            restart: unless-stopped
            ports:
              - "0.0.0.0:8080:80"
            env_file:
              - /opt/bookmanager/.env
            depends_on:
              - backend
            networks:
              - bookmanager-net

        networks:
          bookmanager-net:
            driver: bridge
        COMPOSE

      # ── Pull images and start the app ─────────────────────────
      - cd /opt/bookmanager && docker compose pull
      - cd /opt/bookmanager && docker compose up -d

      # ── Keep app running (restart if containers stop) ─────────
      - |
        cat > /etc/cron.d/bookmanager-health << 'CRON'
        */5 * * * * root cd /opt/bookmanager && docker compose ps --quiet || docker compose up -d >> /var/log/bookmanager-restart.log 2>&1
        CRON

    final_message: "BookManager VM bootstrap complete! App should be running in 2-3 minutes."
  SCRIPT
}

# ─── Network Interface ────────────────────────────────────────
# Connects the VM to the app subnet and attaches the public IP.
resource "azurerm_network_interface" "vm" {
  name                = "${local.name_prefix}-vm-nic"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tags                = local.tags

  ip_configuration {
    name                          = "vm-ip-config"
    subnet_id                     = azurerm_subnet.app.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.vm.id
  }
}

# Associate the VM's NIC with the NSG
resource "azurerm_network_interface_security_group_association" "vm" {
  network_interface_id      = azurerm_network_interface.vm.id
  network_security_group_id = azurerm_network_security_group.vm.id
}

# ─── Linux Virtual Machine ───────────────────────────────────
# Single VM running Ubuntu 22.04 LTS.
# The cloud-init script bootstraps Docker + the app on first boot.
resource "azurerm_linux_virtual_machine" "app" {
  name                = "${local.name_prefix}-vm"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  size = var.vm_size

  admin_username                  = var.admin_username
  disable_password_authentication = true

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key
  }

  network_interface_ids = [azurerm_network_interface.vm.id]

  # Ubuntu 22.04 LTS
  source_image_reference {
    publisher = "Canonical"
    offer     = "0001-com-ubuntu-server-jammy"
    sku       = "22_04-lts-gen2"
    version   = "latest"
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Premium_LRS"
    disk_size_gb         = var.os_disk_size_gb
  }

  # Cloud-init runs on first boot only
  custom_data = base64encode(local.cloud_init_script)

  # Managed Identity: lets the VM authenticate to ACR + Key Vault + Storage
  # without storing any credentials on disk
  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app.id]
  }

  tags = local.tags

  depends_on = [
    azurerm_key_vault_secret.mongodb_uri,
    azurerm_key_vault_secret.jwt_secret,
    azurerm_role_assignment.acr_pull,
    azurerm_role_assignment.keyvault_reader,
  ]
}
