# BookManager — Azure Cloud DevOps Architecture Guide
## From Zero to Production on Microsoft Azure

> **Stack**: NestJS backend + React/Vite frontend + MongoDB Atlas  
> **Platform**: Microsoft Azure (francecentral region)  
> **IaC**: Terraform ≥ 1.6 | **Registry**: Azure ACR + Docker Hub  
> **CI/CD**: GitHub Actions → ACR → VM Scale Set

---

## 📋 Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Azure vs Traditional Concepts](#2-azure-vs-traditional-concepts)
3. [Local Development Environment Setup](#3-local-development-environment-setup)
4. [Azure Account & Authentication](#4-azure-account--authentication)
5. [Terraform Walkthrough (File by File)](#5-terraform-walkthrough-file-by-file)
6. [Deploy the Infrastructure](#6-deploy-the-infrastructure)
7. [Configure CI/CD Pipeline](#7-configure-cicd-pipeline)
8. [Post-Deployment Verification](#8-post-deployment-verification)
9. [Security Deep Dive](#9-security-deep-dive)
10. [Monitoring & Operations](#10-monitoring--operations)
11. [Scaling & High Availability](#11-scaling--high-availability)
12. [Cleanup (terraform destroy)](#12-cleanup)
13. [Cost Reference](#13-cost-reference)

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                     INTERNET (Users)                              │
└─────────────────────────┬────────────────────────────────────────┘
                          │ HTTP :80
                          ▼
┌──────────────────────────────────────────────────────────────────┐
│              Azure Application Gateway (Layer 7)                  │
│         Public IP: xxx.xxx.xxx.xxx                                │
│                                                                   │
│   URL Path Routing:                                               │
│     /api/* ──────────────────────────────┐                       │
│     /*      ─────────────────────────────┼──┐                    │
└─────────────────────────────────────────┼──┼───────────────────-┘
                                          │  │
                    ┌─────────────────────┘  │
                    ▼                        ▼
┌───────────────────────────────────────────────────────────────────┐
│              Azure Virtual Network (10.0.0.0/16)                   │
│                  francecentral region                               │
│                                                                     │
│  ┌─── Public Subnet (10.0.1.0/24) ──────────────────────────────┐ │
│  │  Application Gateway lives here                               │ │
│  │  Azure Bastion lives here (secure SSH)                        │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─── App Subnet (10.0.2.0/24) ─── PRIVATE (no public IPs) ────┐ │
│  │                                                               │ │
│  │   ┌─── VM Scale Set (2–5 instances) ─────────────────────┐   │ │
│  │   │                                                        │   │ │
│  │   │  Instance 1              Instance 2                    │   │ │
│  │   │  ┌──────────────┐       ┌──────────────┐              │   │ │
│  │   │  │ NestJS :3000 │       │ NestJS :3000 │              │   │ │
│  │   │  │ React  :8080 │       │ React  :8080 │              │   │ │
│  │   │  │ Docker       │       │ Docker       │              │   │ │
│  │   │  └──────────────┘       └──────────────┘              │   │ │
│  │   └────────────────────────────────────────────────────────┘   │ │
│  │                  ↑ NAT Gateway (outbound only)                  │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌─── Platform Services ─────────────────────────────────────────┐ │
│  │  Azure Container Registry (ACR)  — Docker images              │ │
│  │  Azure Key Vault                 — Secrets                    │ │
│  │  Azure Blob Storage              — File uploads               │ │
│  │  Log Analytics + App Insights    — Monitoring                 │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                          │
                          ▼ (outbound, via NAT Gateway)
                  MongoDB Atlas (external)
```

---

## 2. Azure vs Traditional Concepts

| Traditional / On-Prem | Azure Equivalent | Used In This Project |
|-----------------------|-----------------|----------------------|
| Physical server / EC2 | Azure VM | VM Scale Set instances |
| Apache/nginx LB | Azure Application Gateway | Path-based L7 routing |
| `/etc/hosts` SSH | Azure Bastion | Secure VM access |
| IPTables rules | Network Security Groups (NSG) | Subnet/NIC firewall |
| `.env` files | Azure Key Vault | Secrets management |
| Local file system | Azure Blob Storage | File uploads |
| Docker Hub / Nexus | Azure Container Registry | Docker images |
| Prometheus + Grafana | Azure Monitor + Workbooks | Metrics |
| ELK Stack | Log Analytics Workspace | Log aggregation |
| New Relic / Datadog | Application Insights | APM |
| Cron + scripts | Azure Monitor Alerts | Auto-notification |
| `sudo useradd` | Managed Identity + RBAC | VM authentication |

---

## 3. Local Development Environment Setup

### 3.1 Install Azure CLI

```powershell
# Windows (winget)
winget install Microsoft.AzureCLI

# Verify
az --version
# Expected: azure-cli 2.x.x
```

```bash
# macOS
brew install azure-cli

# Linux (Ubuntu/Debian)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### 3.2 Install Terraform

```powershell
# Windows
winget install HashiCorp.Terraform

# Verify
terraform version
# Expected: Terraform v1.x.x
```

```bash
# macOS
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Linux (Ubuntu)
sudo apt-get install -y gnupg software-properties-common
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
```

### 3.3 Install Docker

```powershell
# Windows — Install Docker Desktop from:
# https://www.docker.com/products/docker-desktop/

# Verify
docker --version
docker compose version
```

### 3.4 Generate SSH Key Pair

```bash
# Generate a new ed25519 key pair for Azure VM access
ssh-keygen -t ed25519 -C "bookmanager-azure" -f ~/.ssh/id_ed25519_azure

# The public key goes into terraform.tfvars (ssh_public_key)
cat ~/.ssh/id_ed25519_azure.pub

# The private key is used for Bastion SSH or GitHub Actions
```

### 3.5 VS Code Extensions

Install these for a better experience:

- **HashiCorp Terraform** — syntax highlighting, formatting, autocomplete
- **Azure Tools** — Azure resource explorer
- **Docker** — Dockerfile and Compose support
- **GitLens** — enhanced git integration

```bash
code --install-extension hashicorp.terraform
code --install-extension ms-azuretools.vscode-azuretools
code --install-extension ms-azuretools.vscode-docker
```

---

## 4. Azure Account & Authentication

### 4.1 Create a Free Azure Account

1. Go to **[azure.microsoft.com/free](https://azure.microsoft.com/free)**
2. Click **"Start free"**
3. Sign in with a Microsoft account (or create one)
4. Fill in details + credit card (for verification — **$0 charged**)
5. You receive: **$200 free credit** valid for 30 days

### 4.2 Login with Azure CLI

```bash
# Open a terminal and run:
az login

# This opens your browser → sign in → returns to terminal
# You'll see your subscription details printed as JSON

# Verify: show your active subscription
az account show
```

### 4.3 Find Your Subscription & Tenant IDs

```bash
# Subscription ID (needed for Terraform)
az account show --query id -o tsv

# Tenant ID
az account show --query tenantId -o tsv

# List all subscriptions (if you have multiple)
az account list -o table
```

### 4.4 Create a Service Principal for GitHub Actions

A Service Principal is like a "robot user" that GitHub Actions uses to authenticate to Azure.

```bash
# Create a Service Principal with Contributor role
az ad sp create-for-rbac \
  --name "bookmanager-github-actions" \
  --role Contributor \
  --scopes /subscriptions/<your-subscription-id> \
  --json-auth

# Output (save these — you'll need them for GitHub Secrets):
# {
#   "clientId":       "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",  → AZURE_CLIENT_ID
#   "clientSecret":   "xxxxxxxx",                              → AZURE_CLIENT_SECRET
#   "subscriptionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",  → AZURE_SUBSCRIPTION_ID
#   "tenantId":       "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"   → AZURE_TENANT_ID
# }
```

> **IMPORTANT**: For production, use OIDC (passwordless) instead of client secrets. The CI/CD pipeline already uses OIDC — see Section 7.

---

## 5. Terraform Walkthrough (File by File)

### File Structure

```
infrastructure/terraform/
├── providers.tf          # Azure provider + Terraform version
├── variables.tf          # All input variables (types, defaults, descriptions)
├── main.tf               # Resource Group + Managed Identity + RBAC
├── network.tf            # VNet, subnets, App Gateway, NAT, Bastion
├── security.tf           # NSGs + Azure Key Vault + secrets
├── compute.tf            # ACR + VM Scale Set + auto-scale rules
├── storage.tf            # Blob Storage + lifecycle policies
├── monitoring.tf         # Log Analytics + App Insights + alerts
├── outputs.tf            # All output values
└── terraform.tfvars.example
```

### What Each File Does

**`providers.tf`** — Declares which Terraform providers to use and their versions. Think of it as `package.json` for Terraform.

**`variables.tf`** — Defines every configurable input: VM size, region, secrets, etc. Actual values go in `terraform.tfvars`.

**`main.tf`** — The entry point. Creates the Resource Group (container for everything), the Managed Identity (the VM's "passport"), and RBAC role assignments (what the VM is allowed to do).

**`network.tf`** — The most complex file. Creates:
- VNet (your private data center in the cloud)
- 3 subnets with different security levels
- Application Gateway (Layer 7 load balancer with path routing)
- NAT Gateway (lets private VMs reach internet for pulling images)
- Azure Bastion (secure SSH without public IPs)

**`security.tf`** — Two responsibilities:
1. NSG rules (which traffic is allowed where)
2. Azure Key Vault (where MongoDB URI and JWT secret are stored)

**`compute.tf`** — Creates:
- Azure Container Registry (your private Docker Hub)
- VM Scale Set (2+ VMs running your Docker containers)
- Auto-scale rules (add VMs on high CPU, remove on low CPU)
- Cloud-init script (what runs on each new VM)

**`storage.tf`** — Azure Blob Storage for file uploads (book covers, etc.). Equivalent to AWS S3.

**`monitoring.tf`** — Observability stack:
- Log Analytics (central logs from all resources)
- Application Insights (APM for NestJS)
- Metric alerts (CPU, error rate, response time)

---

## 6. Deploy the Infrastructure

### Step 1: Create `terraform.tfvars`

```bash
cd infrastructure/terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` — fill in:
- `subscription_id` (from `az account show --query id -o tsv`)
- `tenant_id` (from `az account show --query tenantId -o tsv`)
- `ssh_public_key` (from `cat ~/.ssh/id_ed25519_azure.pub`)
- `mongodb_uri` (from your MongoDB Atlas dashboard)
- `jwt_secret` (from `openssl rand -hex 64`)

### Step 2: Initialize Terraform

```bash
# Downloads the Azure provider plugin (~150 MB)
terraform init
```

Expected output:
```
Initializing provider plugins...
- Finding hashicorp/azurerm versions matching "~> 3.90"...
- Installing hashicorp/azurerm v3.x.x...
Terraform has been successfully initialized!
```

### Step 3: Validate

```bash
terraform validate
# Expected: Success! The configuration is valid.
```

### Step 4: Plan

```bash
# See every resource that will be created (no changes made yet)
terraform plan -out=bookmanager.tfplan
```

Review the output. You should see ~25-30 resources to create.

### Step 5: Apply

```bash
# Create all resources (takes 10-20 minutes)
terraform apply bookmanager.tfplan
```

Type `yes` when prompted.

> **Application Gateway takes the longest** (~10 minutes). This is normal — it's a complex managed service.

### Step 6: Note the Outputs

```bash
terraform output
# Shows: application_url, acr_login_server, vmss_name, etc.

# Get the app URL
terraform output -raw application_url
```

---

## 7. Configure CI/CD Pipeline

### 7.1 Add GitHub Actions Secrets

In your GitHub repository: **Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | How to Get It |
|-------------|--------------|
| `AZURE_CLIENT_ID` | Service principal `clientId` |
| `AZURE_TENANT_ID` | `az account show --query tenantId -o tsv` |
| `AZURE_SUBSCRIPTION_ID` | `az account show --query id -o tsv` |
| `ACR_LOGIN_SERVER` | `terraform output -raw acr_login_server` |
| `ACR_NAME` | `terraform output -raw acr_name` |
| `AZURE_RESOURCE_GROUP` | `terraform output -raw resource_group_name` |
| `VMSS_NAME` | `terraform output -raw vmss_name` |
| `APP_GATEWAY_PUBLIC_IP` | `terraform output -raw application_gateway_ip` |
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub → Account Settings → Security → New Token |

### 7.2 Configure OIDC (Passwordless GitHub → Azure)

Instead of storing a client secret, configure OIDC so GitHub can authenticate to Azure without passwords:

```bash
# Get your Service Principal's Object ID
SP_OBJECT_ID=$(az ad sp show --id <AZURE_CLIENT_ID> --query id -o tsv)

# Create a federated credential for the main branch
az ad app federated-credential create \
  --id $SP_OBJECT_ID \
  --parameters '{
    "name": "github-main",
    "issuer": "https://token.actions.githubusercontent.com",
    "subject": "repo:YOUR_GITHUB_USERNAME/bookmanager:ref:refs/heads/main",
    "audiences": ["api://AzureADTokenExchange"]
  }'
```

> Replace `YOUR_GITHUB_USERNAME/bookmanager` with your actual repo.

### 7.3 Test the Pipeline

```bash
git add .
git commit -m "feat: Azure DevOps infrastructure"
git push origin main
```

Watch the pipeline at **GitHub → Actions tab**.

Pipeline flow:
```
🔍 Code Quality → 🧪 Tests → 🏗️ Build → 🐳 Docker (ACR + DockerHub) → 🚀 Deploy
```

---

## 8. Post-Deployment Verification

```bash
# Get the application URL
APP_URL=$(terraform output -raw application_url)

# 1. Health check
curl $APP_URL/health

# 2. API test (expect 401 Unauthorized)
curl $APP_URL/api/books

# 3. Open in browser
start $APP_URL   # Windows
open $APP_URL    # macOS

# 4. Check VMSS instances
az vmss list-instances \
  --resource-group $(terraform output -raw resource_group_name) \
  --name $(terraform output -raw vmss_name) \
  -o table

# 5. View ACR images
az acr repository list --name $(terraform output -raw acr_name) -o table

# 6. Check Key Vault secrets exist
az keyvault secret list --vault-name $(terraform output -raw key_vault_name) -o table
```

---

## 9. Security Deep Dive

### Network Security (Defense in Depth)

```
Internet
    │
    ▼ (Only port 80/443 allowed)
Application Gateway
    │
    ▼ (Only App Gateway subnet → VM ports 3000/8080)
VM Scale Set (private subnet, no public IP)
    │
    ▼ (Managed Identity token, not password)
Key Vault / ACR / Storage
```

### Key Security Choices

| Decision | Why |
|----------|-----|
| No public IPs on VMs | VMs not reachable from internet directly |
| NSG deny-all default | Only explicitly allowed traffic passes |
| Managed Identity (not passwords) | VMs authenticate to Azure services without stored credentials |
| Key Vault (not .env files) | Secrets never touch disk, fully audited |
| Azure Bastion (not port 22) | SSH without exposing port 22 to internet |
| OIDC for GitHub Actions | CI/CD authenticates without stored secrets |
| Trivy security scanning | CVEs caught before deployment |

### Accessing the VMs (via Bastion)

```bash
# Via Azure Portal:
# VM Scale Set → Instances → Instance → Connect → Bastion
# (browser-based SSH, no client needed)

# Or via CLI (requires Bastion SSH tunnel):
az network bastion ssh \
  --name $(terraform output -raw resource_group_name | sed 's/-rg//')-prod-bastion \
  --resource-group $(terraform output -raw resource_group_name) \
  --target-resource-id <vmss-instance-resource-id> \
  --auth-type ssh-key \
  --username bookmanager \
  --ssh-key ~/.ssh/id_ed25519_azure
```

---

## 10. Monitoring & Operations

### Azure Portal — Monitoring Dashboard

1. **Azure Portal → Resource Group → bookmanager-prod-rg**
2. Click on **Application Insights** → **Live Metrics** — real-time traffic
3. Click on **Log Analytics Workspace** → **Logs** — query all logs

### Useful KQL Queries (Log Analytics)

```kql
// Last 100 HTTP requests through Application Gateway
AzureDiagnostics
| where ResourceType == "APPLICATIONGATEWAYS"
| where Category == "ApplicationGatewayAccessLog"
| project TimeGenerated, requestUri_s, httpStatus_d, timeTaken_d
| order by TimeGenerated desc
| limit 100

// Application errors in the last hour
AppExceptions
| where TimeGenerated > ago(1h)
| project TimeGenerated, Type, Message, Stack
| order by TimeGenerated desc

// API response times by endpoint (P95)
AppRequests
| where TimeGenerated > ago(1h)
| summarize P95 = percentile(DurationMs, 95) by Name
| order by P95 desc
```

### View Application Insights

```bash
# Open in browser
az monitor app-insights component show \
  --resource-group $(terraform output -raw resource_group_name) \
  --app bookmanager-prod-appinsights \
  --query "appId" -o tsv | xargs -I{} echo "https://portal.azure.com/#resource/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/bookmanager-prod-rg/providers/microsoft.insights/components/bookmanager-prod-appinsights/overview"
```

---

## 11. Scaling & High Availability

### How Auto-Scaling Works

```
CPU < 25% for 10 min  →  Remove 1 VM  (scale in)
CPU > 70% for 5 min   →  Add 1 VM     (scale out)
Min: 2 VMs  |  Max: 5 VMs
```

### Manual Scaling

```bash
# Scale to 3 instances immediately
az vmss scale \
  --resource-group $(terraform output -raw resource_group_name) \
  --name $(terraform output -raw vmss_name) \
  --new-capacity 3
```

### High Availability Guarantees

With 2+ instances in the VMSS:
- If one VM crashes → Application Gateway detects it via health probe → routes traffic to other VMs
- If Azure datacenter has issues → Zone-pinned deployments protect against this (requires Premium tier)
- Rolling upgrades: deploying new image version never takes all VMs offline simultaneously

---

## 12. Cleanup

> ⚠️ **This permanently deletes all Azure resources.**

```bash
cd infrastructure/terraform

# Preview what will be deleted
terraform plan -destroy

# Delete everything
terraform destroy
```

Type `yes` — this takes 5-10 minutes.

---

## 13. Cost Reference

| Resource | SKU | Est. Cost/month |
|----------|-----|----------------|
| VM Scale Set × 2 | Standard_B2s | ~$70 |
| Application Gateway | Standard_v2 (autoscale min 1) | ~$25 |
| Azure Bastion | Basic | ~$140 |
| Azure Container Registry | Basic | ~$5 |
| Azure Blob Storage | Standard LRS, 1 GB | ~$0.02 |
| Log Analytics | 5 GB free, then $2.76/GB | ~$0–5 |
| Application Insights | 5 GB free | ~$0 |
| Key Vault | ~10,000 ops | ~$0.03 |
| Public IPs × 3 | Standard | ~$11 |
| NAT Gateway | 1 unit | ~$32 |
| **TOTAL (approximate)** | | **~$290/month** |

> **Cost optimization options:**
> - Replace Bastion with VPN Gateway (~$27/mo) or just restrict NSG to your IP
> - Use Standard_B1s VMs (~$15/mo each) for dev/staging
> - Application Gateway Standard_v2 with capacity=1 saves ~$10/mo
> - Use Azure Free Trial ($200 credit for 30 days) to test everything for free
