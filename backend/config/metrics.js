const client = require('prom-client');

// Create Prometheus register registry
const register = new client.Registry();

// Collect default node runtime metrics (CPU, memory, handle counts)
client.collectDefaultMetrics({ register });

// Define custom business metrics
const httpRequestsTotal = new client.Counter({
  name: 'job_portal_http_requests_total',
  help: 'Total number of HTTP requests received',
  labelNames: ['method', 'route', 'status']
});

const loginFailuresTotal = new client.Counter({
  name: 'job_portal_login_failures_total',
  help: 'Total number of failed login attempts'
});

const jobApplicationsSubmittedTotal = new client.Counter({
  name: 'job_portal_applications_submitted_total',
  help: 'Total number of job applications submitted'
});

// Register custom metrics
register.registerMetric(httpRequestsTotal);
register.registerMetric(loginFailuresTotal);
register.registerMetric(jobApplicationsSubmittedTotal);

module.exports = {
  register,
  httpRequestsTotal,
  loginFailuresTotal,
  jobApplicationsSubmittedTotal
};
