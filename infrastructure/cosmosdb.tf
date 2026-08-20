# ==============================================================================
# BookManager — MongoDB Atlas (External)
# ==============================================================================
# Using MongoDB Atlas (external managed database) instead of Azure Cosmos DB.
#
# Why Atlas instead of Cosmos DB:
#   - You already have a working Atlas cluster (M0 free tier)
#   - Cosmos DB Serverless has zone-redundancy quota issues in EU regions
#   - Atlas M0 is free — Cosmos DB Serverless costs ~$5-10/month
#   - Your Mongoose schemas work identically with both
#
# The Atlas connection string is passed as a Terraform variable and stored
# in Key Vault. The Container App reads it at runtime via managed identity.
#
# NOTE: Private Endpoint to Atlas requires Atlas M10+ (paid tier).
# On the free tier, the connection goes over the public internet with
# TLS encryption. This is acceptable for staging.
# ==============================================================================

# No Azure resources needed — Atlas is fully external.
# The connection string flows through:
#   var.mongodb_uri → Key Vault secret → Container App env var → NestJS app
