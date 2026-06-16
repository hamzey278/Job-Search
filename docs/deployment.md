# Deployment Guide

This document describes how to deploy the Secure Job Portal Platform locally (for development/testing) and to AWS production environments.

## Local Deployment (Docker Compose)

The entire application stack (DB, Backend, Frontend, Prometheus, Grafana) can be run locally with single commands.

### Prerequisites
- Docker and Docker Compose installed locally.

### Steps

1. **Verify Environment Configuration**:
   Ensure `.env` in the `backend/` directory is correctly configured with local values.

2. **Run Services**:
   Initiate compilation and service launches in detached mode:
   ```bash
   docker-compose up --build -d
   ```

3. **Validate Active Endpoints**:
   - **Frontend**: http://localhost
   - **Backend API**: http://localhost:5000/health
   - **Prometheus**: http://localhost:9090
   - **Grafana**: http://localhost:3000 (Anonymous admin role enabled)

4. **Shutdown Stack**:
   ```bash
   docker-compose down -v
   ```

---

## Production Deployment (AWS & Terraform)

We use Terraform to provision VPC networks, ALB, private instances, S3 storage, and RDS engines.

### Steps

1. **Configure Terraform Values**:
   Create a `terraform.tfvars` file under `infrastructure/terraform` using the provided example:
   ```bash
   cp infrastructure/terraform/terraform.tfvars.example infrastructure/terraform/terraform.tfvars
   ```
   Edit the file to supply custom values (especially a strong `db_password`).

2. **Initialize Terraform Modules**:
   ```bash
   cd infrastructure/terraform
   terraform init
   ```

3. **Plan & Apply Infrastructure**:
   Preview modifications and deploy to AWS:
   ```bash
   terraform plan -out=tfplan.binary
   terraform apply tfplan.binary
   ```

4. **Retrieve Connection Details**:
   Once applied, copy the connection details from the output variables:
   - `alb_dns_name`
   - `s3_bucket_name`
   - `database_endpoint`

5. **Deploy Applications via CI/CD**:
   - Push the code changes to the `main` branch on GitHub.
   - The GitHub Actions pipeline will automatically compile Docker images and trigger a rolling service update with zero downtime.
