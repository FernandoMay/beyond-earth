# Architecture

Aerospace RWA is a reference implementation of an evidence-linked aerospace asset
network. It separates the physical asset, the legal vehicle, the token's defined
rights and the operational record. No layer assumes that a token is title.

## Layers

```text
Public web + four portals
        │  typed client, demo adapter or HTTP
        ▼
Fastify API ── PostgreSQL (operational system of record)
        │
        ├── document verification (SHA-256 / IPFS)
        ├── valuation reference engine
        ├── oracle verification (Ed25519 + freshness)
        ├── notifications (idempotent delivery)
        └── indexer (ordered, idempotent event processing)
        │  Soroban RPC
        ▼
Soroban contracts ── Stellar accounts, SAC/USDC, settlement
```

## Applications

| App                      | Port | Responsibility                                               |
| ------------------------ | ---- | ------------------------------------------------------------ |
| `apps/web`               | 3000 | Public marketplace, asset detail, protocol, compliance, docs |
| `apps/investor-portal`   | 3001 | Portfolio, distributions, opportunities, onboarding          |
| `apps/issuer-portal`     | 3002 | Asset pipeline, new structures, offerings, evidence          |
| `apps/admin-portal`      | 3003 | Compliance queue, registry review, deployments, audit        |
| `apps/operations-portal` | 3004 | Leases, maintenance, insurance, oracles, tasks               |

Every app is a Next.js App Router application. Shared visual language lives in
`packages/design-system`; shared domain data lives in `packages/shared-types`.

## Services

| Service                          | Output                                                             |
| -------------------------------- | ------------------------------------------------------------------ |
| `services/api`                   | Fastify HTTP API, in-memory demo repository, PostgreSQL repository |
| `services/indexer`               | Ordered event processor with cursor and processed-id store         |
| `services/oracle-adapters`       | Ed25519 verification, source allowlist, freshness and bands        |
| `services/valuation`             | Transparent DCF reference engine with haircuts and warnings        |
| `services/document-verification` | Manifest creation and byte-for-byte verification                   |
| `services/notifications`         | Template rendering, environment labels, idempotent transport       |

The indexer, oracle, valuation, document and notification packages are typed
libraries. A deployment can host them inside the API process, a worker or a
separate service without changing their contracts.

## Trust boundaries

1. **Browser to API.** Demo mode is safe by default. Writes require a live API,
   an API key and a non-demo repository.
2. **API to database.** Zod validates request bodies. JSONB payloads are written
   by the repository; operational columns are derived from the same record.
3. **API to Stellar.** No service signs a transaction in demo mode. Production
   signing belongs in a dedicated signer with policy controls, not in the web app.
4. **Contracts to evidence.** The registry stores the reviewed evidence hash. A
   document swap requires a new review.
5. **Oracle to contract.** Only signed, fresh, in-band readings from approved
   sources should influence a valuation or lease state.

## Failure behaviour

- A failed indexer handler stops the batch and leaves the cursor at the last good
  ledger.
- A failed evidence check reports every missing, modified, duplicate or
  unexpected file.
- A stale or forged oracle reading is rejected before use.
- A compliance failure reverts the token transfer or subscription atomically.
- A failed notification transport records nothing, so the idempotency key can be
  retried.

## Related documents

- [PROTOCOL.md](PROTOCOL.md)
- [COMPLIANCE.md](COMPLIANCE.md)
- [API.md](API.md)
- [DEMO_MODE.md](DEMO_MODE.md)
- [OPERATIONS.md](OPERATIONS.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [TESTING.md](TESTING.md)
