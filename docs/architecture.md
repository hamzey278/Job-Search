# System Architecture

This document describes the high-level architecture of the Secure Job Portal Platform.

## Overview

The platform is designed with a modern, high-availability three-tier web application architecture.

```mermaid
graph TD
    Client[Browser Client] -->|HTTPS| ALB[Application Load Balancer]
    subgraph Public Subnets (AZ1 & AZ2)
        ALB
    end
    subgraph Private Subnets (AZ1 & AZ2)
        ALB -->|Forward Request| App[Express Backend API Server]
        App -->|Query DB| DB[(Multi-AZ PostgreSQL RDS)]
        App -->|Telemetry| Prom[Prometheus Scraper]
        Prom -->|Visualize| Graf[Grafana Dashboard]
        NodeExp[Node Exporter] -->|System Stats| Prom
        App -->|Upload Resumes| S3[Private AWS S3 Bucket]
    end
```

## System Components

1. **Presentation Layer (Frontend)**:
   - Built with React.js using Vite.
   - Served via Nginx in production with security headers enabled.
   - Utilizes Axios with interceptors to handle token persistence and session lifecycle.
   - Enforces Client-side validation and role protection to secure navigation.

2. **Application Layer (Backend)**:
   - Built on Node.js using Express.
   - Stateless API endpoints protected by custom JWT parsing and RBAC filters.
   - Integrates security layers: `helmet` for HTTP headers, `cors` for origin restriction, and `express-rate-limit` for rate limiting.
   - Implements file signature header inspection (magic bytes) to analyze uploaded resume contents before saving.

3. **Database Layer (Persistence)**:
   - Managed PostgreSQL database.
   - Fully isolated inside private subnets, only accepting traffic on port `5432` from application instances.
   - Pre-configured triggers to automatically update row modified timestamps.

4. **Telemetry & Observability Layer**:
   - **Prometheus**: Periodically scrapes node resource utilization and custom API metrics (HTTP response latency, login failure count, and job application submission volume).
   - **Grafana**: Automates data source connections to Prometheus and builds dashboards for active monitoring.
   - **Node Exporter**: Measures virtual host-level CPU, Memory, Disk, and network performance.
