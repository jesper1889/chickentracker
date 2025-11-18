#!/bin/bash

# ChickenTracker - Google Cloud Run Deployment Script
# This script automates the deployment process to GCP

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  ChickenTracker GCP Deployment${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Load environment variables from .env.gcp if it exists
if [ -f .env.gcp ]; then
    echo -e "${GREEN}Loading GCP configuration...${NC}"
    export $(cat .env.gcp | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env.gcp file not found${NC}"
    echo "Please create .env.gcp file with your GCP configuration"
    echo "See .env.gcp.example for reference"
    exit 1
fi

# Verify required variables
REQUIRED_VARS=("GCP_PROJECT_ID" "GCP_REGION" "GCP_SERVICE_NAME")
for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: $var is not set in .env.gcp${NC}"
        exit 1
    fi
done

echo -e "${YELLOW}Project ID:${NC} $GCP_PROJECT_ID"
echo -e "${YELLOW}Region:${NC} $GCP_REGION"
echo -e "${YELLOW}Service Name:${NC} $GCP_SERVICE_NAME"
echo ""

# Set the active project
echo -e "${GREEN}Setting active GCP project...${NC}"
gcloud config set project "$GCP_PROJECT_ID"

# Build the Docker image
echo -e "${GREEN}Building Docker image...${NC}"
gcloud builds submit --tag "gcr.io/$GCP_PROJECT_ID/$GCP_SERVICE_NAME"

# Deploy to Cloud Run
echo -e "${GREEN}Deploying to Cloud Run...${NC}"
gcloud run deploy "$GCP_SERVICE_NAME" \
  --image "gcr.io/$GCP_PROJECT_ID/$GCP_SERVICE_NAME" \
  --platform managed \
  --region "$GCP_REGION" \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-cloudsql-instances "$GCP_PROJECT_ID:$GCP_REGION:$GCP_DB_INSTANCE" \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --port 3000

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo -e "Your application is now running at:"
echo -e "${YELLOW}$(gcloud run services describe $GCP_SERVICE_NAME --region $GCP_REGION --format 'value(status.url)')${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Run database migrations: ./scripts/migrate-db.sh"
echo "2. Check logs: gcloud run services logs read $GCP_SERVICE_NAME --region $GCP_REGION"
echo ""
