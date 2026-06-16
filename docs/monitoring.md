# Monitoring & Observability

This document details the telemetry stack, custom metric counters, and alert configurations for the Secure Job Portal Platform.

## Monitored Metrics

The Node.js backend exposes structured endpoints at `/metrics` using the `prom-client` package.

### 1. Custom Business Metrics
- `job_portal_http_requests_total`: Counter tracking total incoming API requests by HTTP method, path, and response status code.
- `job_portal_login_failures_total`: Counter tracking total failed login entries.
- `job_portal_applications_submitted_total`: Counter tracking total candidate application submissions.

### 2. Node Runtime Metrics
- CPU load averages.
- Process heap allocation and memory usage.
- Open network connections and event loop delays.

### 3. Operating System Metrics (via Node Exporter)
- Host CPU load percentage.
- Active RAM/swap space usage.
- Disk filesystem capacities.

---

## Alert Rules & Thresholds

Prometheus triggers notifications if metrics exceed predefined thresholds:

1. **HostCpuHigh** (Severity: `Warning`): CPU usage is > 80% for more than 2 minutes.
2. **HostMemoryHigh** (Severity: `Warning`): Memory usage is > 85% for more than 2 minutes.
3. **HostDiskHigh** (Severity: `Critical`): Disk space utilization exceeds 90% for over 5 minutes.
4. **BackendServiceUnavailable** (Severity: `Critical`): Express API container is unreachable.
5. **SecurityBruteForceLoginAttempts** (Severity: `Critical`): Rate of login failures is > 20 in 5 minutes (indicates active brute force).

---

## Grafana Dashboards

Grafana automatically loads layouts from `monitoring/grafana/dashboards/` on start:

- **Anonymous Access**: Configured in local environments to permit instant read access without credentials.
- **Visual Panels**:
  - Gauge cards displaying Host CPU and memory limits.
  - Stat counters tracking total API traffic, failed auth counts, and completed job applications.
  - Interactive graphs representing database connection activity.
