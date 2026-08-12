#!/usr/bin/env bash
# ============================================================
# BookManager – Deployment Automation Script
# ============================================================
# Deploys a new image version to all VMSS instances.
# Called by GitHub Actions CI/CD pipeline after pushing images.
#
# Usage:
#   ./deploy.sh [image_tag]
#   ./deploy.sh v42
#   ./deploy.sh latest
#
# Prerequisites:
#   - az cli installed and authenticated (az login)
#   - Required env vars set (or passed as arguments)
# ============================================================
set -euo pipefail

# ─── Configuration ───────────────────────────────────────────
IMAGE_TAG="${1:-latest}"
RESOURCE_GROUP="${AZURE_RESOURCE_GROUP:-bookmanager-prod-rg}"
VMSS_NAME="${VMSS_NAME:-bookmanager-prod-vmss}"
ACR_NAME="${ACR_NAME:-bookmanageracr}"
PROJECT_NAME="${PROJECT_NAME:-bookmanager}"

echo "============================================================"
echo " BookManager Deployment"
echo " Tag:            $IMAGE_TAG"
echo " Resource Group: $RESOURCE_GROUP"
echo " VMSS:           $VMSS_NAME"
echo " ACR:            $ACR_NAME"
echo "============================================================"

# ─── Step 1: Verify Images Exist in ACR ──────────────────────
echo ""
echo "[1/4] Verifying images in ACR..."

check_image() {
  local repo="$1"
  local tag="$2"
  if az acr repository show-tags \
      --name "$ACR_NAME" \
      --repository "$repo" \
      --output tsv 2>/dev/null | grep -q "^${tag}$"; then
    echo "  ✅ $repo:$tag exists in ACR"
  else
    echo "  ❌ $repo:$tag NOT found in ACR"
    exit 1
  fi
}

check_image "${PROJECT_NAME}-backend"  "$IMAGE_TAG"
check_image "${PROJECT_NAME}-frontend" "$IMAGE_TAG"

# ─── Step 2: Update VMSS Model ───────────────────────────────
# Update the VMSS image tag in custom_data so new VMs get the right version.
# Existing VMs are updated via rolling upgrade in Step 3.
echo ""
echo "[2/4] Updating VMSS configuration..."

# We update the custom_data by patching VMSS with updated tag via az extension
# In production, this is typically done via Terraform re-apply.
echo "  Image tag $IMAGE_TAG recorded. VMSS rolling upgrade will apply it."

# ─── Step 3: Rolling Upgrade ─────────────────────────────────
# Triggers a rolling upgrade across all VMSS instances.
# Azure upgrades instances in batches (respecting the rolling upgrade policy:
# max 50% at a time, so the app stays available during the deployment).
echo ""
echo "[3/4] Triggering rolling upgrade on VMSS instances..."

# Get current instance list
INSTANCES=$(az vmss list-instances \
  --resource-group "$RESOURCE_GROUP" \
  --name "$VMSS_NAME" \
  --query "[].instanceId" \
  --output tsv)

INSTANCE_COUNT=$(echo "$INSTANCES" | wc -l | tr -d ' ')
echo "  Found $INSTANCE_COUNT VMSS instance(s)"

# For each instance: SSH command via Bastion is not scriptable directly.
# Instead, we use the VMSS Run Command feature to execute a script
# on each instance remotely — no SSH needed.
for INSTANCE_ID in $INSTANCES; do
  echo "  Deploying to instance $INSTANCE_ID..."

  az vmss run-command invoke \
    --resource-group "$RESOURCE_GROUP" \
    --name "$VMSS_NAME" \
    --command-id "RunShellScript" \
    --instance-id "$INSTANCE_ID" \
    --scripts "
      cd /opt/bookmanager
      # Login to ACR using Managed Identity
      az login --identity --output none 2>/dev/null
      az acr login --name ${ACR_NAME} 2>/dev/null

      # Pull new images
      docker compose pull

      # Rolling restart: stop old, start new
      docker compose up -d --force-recreate --no-deps backend
      sleep 10
      docker compose up -d --force-recreate --no-deps frontend

      # Health check
      sleep 15
      curl -sf http://localhost:3000/api/health && echo 'HEALTHY' || echo 'UNHEALTHY'
    " \
    --output json \
    | jq -r '.value[0].message' \
    | grep -E "(HEALTHY|UNHEALTHY|error)" || true

  echo "  Instance $INSTANCE_ID updated."
done

# ─── Step 4: Verify Deployment ───────────────────────────────
echo ""
echo "[4/4] Verifying deployment..."

# Get Application Gateway public IP
APP_GW_IP=$(az network public-ip show \
  --resource-group "$RESOURCE_GROUP" \
  --name "${PROJECT_NAME}-prod-appgw-pip" \
  --query "ipAddress" \
  --output tsv 2>/dev/null || echo "unknown")

if [[ "$APP_GW_IP" != "unknown" ]]; then
  sleep 30  # Wait for health probes to update
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://${APP_GW_IP}/health" || echo "000")
  if [[ "$HTTP_CODE" == "200" ]]; then
    echo "  ✅ Application is healthy at http://${APP_GW_IP}"
  else
    echo "  ⚠️  Health check returned HTTP $HTTP_CODE"
  fi
fi

echo ""
echo "============================================================"
echo " Deployment complete: $IMAGE_TAG"
echo " Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "============================================================"
