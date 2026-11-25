# API

Base URL: `http://localhost:4000`

## Endpoints

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | none | Service, mode, repository and network |
| GET | `/metrics` | none | Prometheus text metrics |
| GET | `/v1/snapshot` | none | Full demo/operational snapshot |
| GET | `/v1/assets` | none | Filter by `vertical`, `status`, `q`, `limit`, `offset` |
| GET | `/v1/assets/:id` | none | Asset by id or slug |
| POST | `/v1/assets` | API key | Create an illustrative draft asset |
| GET | `/v1/investor` | none | Demo investor profile |
| GET | `/v1/distributions` | none | Distribution register |
| GET | `/v1/compliance/cases` | none | Compliance queue |
| POST | `/v1/compliance/decisions` | API key | Record a review decision |
| GET | `/v1/operations/tasks` | none | Operations task queue |
| POST | `/v1/subscriptions` | API key in live mode | Idempotent subscription intent |

Write requests require `x-api-key`. Subscriptions also accept `idempotency-key`;
the header takes precedence over the body when it is at least eight characters.
Issuer writes may send `x-actor` for the audit label.

## Demo mode

`DEMO_MODE=true` is the default. In demo mode:

- `POST /v1/subscriptions` returns HTTP 200 with
  `{ mode: "demo", accepted: false, code: "DEMO_MODE" }`;
- compliance decisions and asset writes return HTTP 409 `DEMO_MODE`;
- no transaction is built, signed or submitted.

## Errors

```json
{
  "error": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "requestId": "req-1",
  "details": [{ "path": "amount.amount", "message": "Amount must be positive" }]
}
```

| Code | Meaning |
| --- | --- |
| `VALIDATION_ERROR` | Zod rejected the request |
| `DEMO_MODE` | Write attempted in demo mode |
| `UNAUTHORIZED` | Missing or invalid API key |
| `NOT_CONFIGURED` | Live mode without an API key |
| `ASSET_NOT_FOUND` | Unknown asset id or slug |
| `CASE_NOT_FOUND` | Unknown compliance case |
| `ROUTE_NOT_FOUND` | Unknown route |
| `INTERNAL_ERROR` | Unhandled server error |

## Example

```bash
curl http://localhost:4000/v1/assets?vertical=aviation

curl -X POST http://localhost:4000/v1/subscriptions \
  -H 'content-type: application/json' \
  -H 'idempotency-key: demo-request-001' \
  -d '{
    "offeringId": "offering_demo_1",
    "wallet": "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    "amount": { "amount": 25000, "currency": "USDC" },
    "idempotencyKey": "demo-request-001",
    "acknowledgement": true
  }'
```

## Production notes

- Terminate TLS in front of the API.
- Rotate the API key and store it in a secret manager.
- Put rate limiting and request-size limits at the edge.
- Use the PostgreSQL repository and run migrations before starting the API.
- Do not expose `/metrics` publicly without network controls.
