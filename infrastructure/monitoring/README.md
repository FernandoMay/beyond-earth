# Monitoring

The API exposes a Prometheus text endpoint at `GET /metrics` with:

- `aerospace_api_requests_total`
- `aerospace_api_errors_total` (5xx only)
- `aerospace_api_uptime_seconds`
- `aerospace_api_demo_mode`

`prometheus.yml` scrapes the API inside the Docker network. `alerts.yml` covers
availability, 5xx responses and an informational demo-mode alert. Import
`grafana-dashboard.json` into Grafana and point it at the Prometheus data source.

Demo-mode alerts are informational: a reference environment is expected to run
with `DEMO_MODE=true`. Never remove that label while evaluating the platform.
