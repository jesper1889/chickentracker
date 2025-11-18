# ChickenTracker - Google Cloud Platform Deployment Guide

This guide walks you through deploying ChickenTracker to Google Cloud Platform using Cloud Run and Cloud SQL.

## Prerequisites

- Google Cloud Platform account with billing enabled
- gcloud CLI installed on your machine
- A GCP project created

## Table of Contents

1. [Initial Setup](#1-initial-setup)
2. [Install Google Cloud CLI](#2-install-google-cloud-cli)
3. [Create GCP Project](#3-create-gcp-project)
4. [Set Up Cloud SQL](#4-set-up-cloud-sql)
5. [Configure Environment Variables](#5-configure-environment-variables)
6. [Deploy to Cloud Run](#6-deploy-to-cloud-run)
7. [Run Database Migrations](#7-run-database-migrations)
8. [Verify Deployment](#8-verify-deployment)

---

## 1. Initial Setup

### Install Google Cloud CLI

On macOS:
```bash
brew install google-cloud-sdk
```

On Linux:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

On Windows:
Download the installer from: https://cloud.google.com/sdk/docs/install

### Authenticate with Google Cloud

```bash
gcloud auth login
gcloud auth application-default login
```

---

## 2. Create GCP Project

### Option A: Using Console
1. Go to https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Enter project name: `chickentracker`
4. Note your PROJECT_ID

### Option B: Using CLI
```bash
# Create project
gcloud projects create chickentracker-[UNIQUE-ID] --name="ChickenTracker"

# Set as active project
gcloud config set project chickentracker-[UNIQUE-ID]
```

### Enable Required APIs

```bash
# Enable Cloud Run API
gcloud services enable run.googleapis.com

# Enable Cloud Build API (for container builds)
gcloud services enable cloudbuild.googleapis.com

# Enable Cloud SQL Admin API
gcloud services enable sqladmin.googleapis.com

# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Enable Artifact Registry API
gcloud services enable artifactregistry.googleapis.com
```

---

## 3. Set Up Cloud SQL

### Create PostgreSQL Instance

```bash
gcloud sql instances create chickentracker-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --root-password=YOUR_SECURE_PASSWORD \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase
```

**Note:** For production, use a larger tier like `db-custom-2-7680` (2 vCPUs, 7.5GB RAM).

### Create Database

```bash
gcloud sql databases create chickentracker \
  --instance=chickentracker-db
```

### Create Database User

```bash
gcloud sql users create chickentracker \
  --instance=chickentracker-db \
  --password=YOUR_SECURE_DB_PASSWORD
```

### Get Connection String

```bash
gcloud sql instances describe chickentracker-db \
  --format='value(connectionName)'
```

Save this value - you'll need it for `DATABASE_URL`.

---

## 4. Configure Environment Variables

### Create Secrets in Secret Manager

```bash
# Generate NextAuth secret
openssl rand -base64 32

# Create DATABASE_URL secret
gcloud secrets create database-url \
  --replication-policy="automatic" \
  --data-file=- <<EOF
postgresql://chickentracker:YOUR_DB_PASSWORD@/chickentracker?host=/cloudsql/PROJECT_ID:REGION:chickentracker-db
EOF

# Create NEXTAUTH_SECRET
gcloud secrets create nextauth-secret \
  --replication-policy="automatic" \
  --data-file=- <<EOF
YOUR_GENERATED_SECRET_FROM_ABOVE
EOF
```

### Create .env.gcp File

```bash
# Copy example file
cp .env.gcp.example .env.gcp

# Edit with your values
nano .env.gcp
```

Fill in your actual values:
```env
GCP_PROJECT_ID=your-actual-project-id
GCP_REGION=us-central1
GCP_SERVICE_NAME=chickentracker
GCP_DB_INSTANCE=chickentracker-db
GCP_DB_NAME=chickentracker
GCP_DB_USER=chickentracker
GCP_DB_PASSWORD=your-secure-password
NEXTAUTH_SECRET=your-generated-secret
```

---

## 5. Deploy to Cloud Run

### Option A: Using Deployment Script (Recommended)

```bash
./deploy.sh
```

### Option B: Manual Deployment

```bash
# Build and push container
gcloud builds submit --tag gcr.io/PROJECT_ID/chickentracker

# Deploy to Cloud Run
gcloud run deploy chickentracker \
  --image gcr.io/PROJECT_ID/chickentracker \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-cloudsql-instances PROJECT_ID:us-central1:chickentracker-db \
  --add-cloudsql-instances PROJECT_ID:us-central1:chickentracker-db \
  --set-secrets DATABASE_URL=database-url:latest,NEXTAUTH_SECRET=nextauth-secret:latest \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --port 3000
```

---

## 6. Run Database Migrations

### Get Cloud Run Service URL

```bash
gcloud run services describe chickentracker \
  --region us-central1 \
  --format 'value(status.url)'
```

### Update NEXTAUTH_URL Secret

```bash
# Create or update the secret
echo "https://YOUR-CLOUD-RUN-URL.run.app" | \
  gcloud secrets create nextauth-url --data-file=-

# Or update existing
echo "https://YOUR-CLOUD-RUN-URL.run.app" | \
  gcloud secrets versions add nextauth-url --data-file=-
```

### Run Migrations via Cloud Run Job

```bash
# Create a Cloud Run Job for migrations
gcloud run jobs create chickentracker-migrate \
  --image gcr.io/PROJECT_ID/chickentracker \
  --region us-central1 \
  --set-cloudsql-instances PROJECT_ID:us-central1:chickentracker-db \
  --set-secrets DATABASE_URL=database-url:latest \
  --command npx \
  --args prisma,migrate,deploy

# Execute the job
gcloud run jobs execute chickentracker-migrate --region us-central1
```

### Seed Database (Optional)

```bash
gcloud run jobs create chickentracker-seed \
  --image gcr.io/PROJECT_ID/chickentracker \
  --region us-central1 \
  --set-cloudsql-instances PROJECT_ID:us-central1:chickentracker-db \
  --set-secrets DATABASE_URL=database-url:latest \
  --command npx \
  --args prisma,db,seed

gcloud run jobs execute chickentracker-seed --region us-central1
```

---

## 7. Verify Deployment

### Check Service Status

```bash
gcloud run services describe chickentracker --region us-central1
```

### View Logs

```bash
gcloud run services logs read chickentracker --region us-central1 --limit 50
```

### Test Health Endpoint

```bash
SERVICE_URL=$(gcloud run services describe chickentracker --region us-central1 --format 'value(status.url)')
curl $SERVICE_URL/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-XX-XXTXX:XX:XX.XXXZ",
  "service": "chickentracker"
}
```

### Access Your Application

```bash
# Get the URL
echo "Your application is running at:"
gcloud run services describe chickentracker --region us-central1 --format 'value(status.url)'
```

Visit the URL in your browser and log in with:
- Email: `user1@example.com`
- Password: `password123`

---

## 8. Cost Optimization

### Enable Request-Based Billing
Cloud Run charges only for:
- Request processing time
- Container CPU/Memory allocation
- Egress traffic

### Optimize Costs:
```bash
# Set minimum instances to 0 (no idle costs)
gcloud run services update chickentracker \
  --min-instances 0 \
  --region us-central1

# Use smaller machine if sufficient
gcloud run services update chickentracker \
  --memory 256Mi \
  --cpu 1 \
  --region us-central1
```

### Expected Monthly Costs (Estimates):
- Cloud Run: $0-5/month (2M free requests)
- Cloud SQL (f1-micro): ~$7-10/month
- Cloud Build: Free tier (120 build-minutes/day)
- **Total: ~$7-15/month**

---

## Troubleshooting

### Check Logs
```bash
gcloud run services logs read chickentracker --region us-central1 --limit 100
```

### Cloud SQL Connection Issues
```bash
# Verify Cloud SQL instance is running
gcloud sql instances describe chickentracker-db

# Check firewall rules
gcloud sql instances describe chickentracker-db --format="value(ipConfiguration)"
```

### Container Build Failures
```bash
# View build logs
gcloud builds list --limit 5
gcloud builds log BUILD_ID
```

### Database Migration Issues
```bash
# Execute migration manually via Cloud Run Job
gcloud run jobs execute chickentracker-migrate --region us-central1 --wait

# Check job logs
gcloud run jobs executions logs chickentracker-migrate --region us-central1
```

---

## Updating the Deployment

### Redeploy After Code Changes

```bash
# Option 1: Use deployment script
./deploy.sh

# Option 2: Manual
gcloud builds submit --tag gcr.io/PROJECT_ID/chickentracker
gcloud run services update chickentracker \
  --image gcr.io/PROJECT_ID/chickentracker:latest \
  --region us-central1
```

### Update Environment Variables

```bash
# Update secret
echo "new-secret-value" | gcloud secrets versions add SECRET_NAME --data-file=-

# Redeploy to pick up changes
gcloud run services update chickentracker --region us-central1
```

---

## Cleanup (Delete Everything)

```bash
# Delete Cloud Run service
gcloud run services delete chickentracker --region us-central1

# Delete Cloud SQL instance
gcloud sql instances delete chickentracker-db

# Delete secrets
gcloud secrets delete database-url
gcloud secrets delete nextauth-secret

# Delete container images
gcloud container images delete gcr.io/PROJECT_ID/chickentracker
```

---

## Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL for PostgreSQL](https://cloud.google.com/sql/docs/postgres)
- [Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/jesper1889/chickentracker/issues
- GCP Support: https://cloud.google.com/support

---

*Last Updated: 2024-11-18*
