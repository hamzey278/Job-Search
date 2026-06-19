# Kubernetes Deployment Guide

This guide describes how to deploy the **Secure Job Portal** stack to a Kubernetes cluster for local testing or staging/production.

## Directory Structure

```text
kubernetes/
├── namespace.yaml                # Isolated namespace definition (job-portal)
├── db-secret.yaml                # Database credentials
├── db-init-configmap.yaml        # Schema initialization script (init-db.sql)
├── db-pvc.yaml                   # PostgreSQL persistence volume claim
├── db-deployment.yaml            # PostgreSQL deployment and internal service
├── backend-secret.yaml           # JWT secret key
├── backend-configmap.yaml        # Non-sensitive backend configs
├── backend-pvc.yaml              # Uploaded resumes volume claim
├── backend-deployment.yaml        # Express API backend deployment and service
├── frontend-configmap.yaml       # Nginx proxy configuration (handles relative URL mapping)
├── frontend-deployment.yaml       # React SPA deployment and service
├── ingress.yaml                  # Routing rules mapping external traffic to the frontend
└── monitoring/                   # Cluster monitoring setup
    ├── prometheus-configmap.yaml # Prometheus configuration & metrics collection rules
    ├── prometheus-deployment.yaml# Prometheus deployment and service
    ├── node-exporter-daemonset.yaml # Node hardware exporter
    └── grafana-deployment.yaml   # Grafana dashboards with anonymous admin mode
```

---

## Prerequisites

1. **Docker** and a local Kubernetes provider such as **Minikube**, **Kind**, or **Docker Desktop (K8s enabled)**.
2. `kubectl` CLI installed and configured.

---

## Step-by-Step Deployment Instructions

### 1. Build and Load Application Images

Since we are using local images (`jobportal-backend:latest` and `jobportal-frontend:latest`), compile them locally:

```bash
# Build the Backend
docker build -t jobportal-backend:latest ./backend

# Build the Frontend
docker build -t jobportal-frontend:latest ./frontend
```

If you are using **Minikube**, load these images directly into the Minikube registry so it doesn't try to download them from Docker Hub:

```bash
minikube image load jobportal-backend:latest
minikube image load jobportal-frontend:latest
```

---

### 2. Apply Configs in Sequence

Deploy the manifests in order to establish namespaces, database configurations, stateful volumes, and run the pods.

#### Phase A: Namespace & Secrets
```bash
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/db-secret.yaml
kubectl apply -f kubernetes/backend-secret.yaml
```

#### Phase B: Configuration Maps
```bash
kubectl apply -f kubernetes/db-init-configmap.yaml
kubectl apply -f kubernetes/backend-configmap.yaml
kubectl apply -f kubernetes/frontend-configmap.yaml
```

#### Phase C: Storage Claims (PVCs)
```bash
kubectl apply -f kubernetes/db-pvc.yaml
kubectl apply -f kubernetes/backend-pvc.yaml
```

#### Phase D: Deploy Core Stack (Database, Backend, Frontend)
```bash
kubectl apply -f kubernetes/db-deployment.yaml
kubectl apply -f kubernetes/backend-deployment.yaml
kubectl apply -f kubernetes/frontend-deployment.yaml
```

#### Phase E: Deploy Ingress
```bash
kubectl apply -f kubernetes/ingress.yaml
```

#### Phase F: Deploy Monitoring (Prometheus, Grafana, Node Exporter)
```bash
kubectl apply -f kubernetes/monitoring/
```

---

## Verification & Usage

### 1. Check Pod/Service Status

Verify all components are running in the `job-portal` namespace:

```bash
kubectl get all -n job-portal
```

Expect output showing pods for `db`, `backend`, `frontend`, `prometheus`, `grafana`, and `node-exporter` running successfully.

### 2. Port Forwarding for Local Testing

If you don't have an Ingress controller configured, you can expose the services locally using port forwarding:

#### Access the Frontend application:
```bash
kubectl port-forward svc/frontend 8080:80 -n job-portal
```
Visit http://localhost:8080 in your browser. (The frontend service will automatically proxy `/api` calls to the backend on your behalf).

#### Access the Grafana Dashboard:
```bash
kubectl port-forward svc/grafana 3000:3000 -n job-portal
```
Visit http://localhost:3000 in your browser to view system metrics (pre-loaded anonymous admin session).

#### Access the Prometheus console:
```bash
kubectl port-forward svc/prometheus 9090:9090 -n job-portal
```
Visit http://localhost:9090 in your browser to run raw PromQL queries.

### 3. Cleanup

To destroy all deployed Kubernetes resources:

```bash
kubectl delete ns job-portal
```
This single command safely removes the namespace and all configurations, storage volumes, and running workloads inside it.
