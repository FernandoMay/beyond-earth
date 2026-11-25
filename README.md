# AEROSPACE RWA

**The Aerospace Asset Financial Network**

Aerospace RWA is a reference implementation of an institutional-grade financial network for real-world aerospace assets. It connects asset owners, operators, lessors and eligible investors through a common asset registry, compliance layer, tokenization engine, investment and escrow flows, leasing records and on-chain revenue settlement on **Stellar + Soroban**.

> **Status: reference implementation / Stellar Testnet.** This repository is not a live securities platform, does not custody funds, and does not offer investments to the public. Every asset, valuation and offering in the application is clearly labelled demonstration data. No fictional asset, investment or transaction is presented as real.

---

## What is in this repository

| Layer | Implementation |
| --- | --- |
| Public platform | Next.js marketplace, asset pages, protocol and compliance documentation |
| Investor portal | Portfolio, holdings, distributions, eligibility and opportunity discovery |
| Issuer portal | Asset onboarding, offering pipeline, capital and distribution administration |
| Admin portal | Issuer reviews, verification queue, protocol health and risk |
| Operations portal | Leases, maintenance, insurance, valuations and oracle freshness |
| Protocol | 10 Soroban contracts in Rust covering registry, compliance, regulated token, investment, escrow, revenue, leasing, marketplace and governance |
| Services | API, event indexer, valuation engine, oracle adapters, document verification and notifications |
| Data | PostgreSQL schema, migrations, seed and repository adapters |
| Standards | SEP-0057-aligned regulated token design, ERC-3643 conceptual model, Stellar assets/SAC and USDC settlement |
| Delivery | CI, contract tests, unit tests, API integration tests, E2E scaffolding, security policy, ADRs and deployment runbook |

The protocol is designed for five verticals from day one:

1. **Aviation RWA** — aircraft, engines, leases and fleets.
2. **Space RWA** — satellites, orbital infrastructure and service contracts.
3. **Aerospace Manufacturing RWA** — tooling, components and inventory.
4. **Drone RWA** — fleets, operational capacity and logistics infrastructure.
5. **Aerospace Marketplace** — a cross-vertical market for economic participation.

The first reference structure is an aircraft-engine lease participation. The legal model, token rights and transfer restrictions are explicitly separated from the technical token.

---

## Architecture at a glance

```text
┌────────────────────────────────────────────────────────────────────┐
│                        PRODUCT & APPLICATION LAYER                 │
│  Investor portal · Issuer portal · Admin · Operations · Marketplace │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │ typed API / demo adapter
┌─────────────────────────────────▼──────────────────────────────────┐
│                         SERVICES & DATA LAYER                      │
│  API · Indexer · Valuations · Oracles · Documents · Notifications   │
│                      PostgreSQL · IPFS evidence                    │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │ Soroban RPC
┌─────────────────────────────────▼──────────────────────────────────┐
│                    AEROSPACE RWA PROTOCOL (SOROBAN)                │
│ Asset Registry · Compliance · Regulated Token · Investment         │
│ Escrow · Revenue Distribution · Leasing · Marketplace · Governance │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │
┌─────────────────────────────────▼──────────────────────────────────┐
│                           STELLAR NETWORK                          │
│        Stellar assets · SAC · USDC · wallets · settlement          │
└────────────────────────────────────────────────────────────────────┘
```

More detail: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/PROTOCOL.md`](docs/PROTOCOL.md), [`docs/VERTICALS.md`](docs/VERTICALS.md).

---

## Quick start

**Prerequisites:** Node.js 22+, npm 11+, Rust 1.85+, Stellar CLI 23+ (for contracts).

```bash
# 1. Install JavaScript dependencies
npm install

# 2. Run the public site and all four portals + API
npm run dev
```

| Surface | URL |
| --- | --- |
| Public platform | http://localhost:3000 |
| Investor portal | http://localhost:3001 |
| Issuer portal | http://localhost:3002 |
| Admin portal | http://localhost:3003 |
| Operations portal | http://localhost:3004 |
| API | http://localhost:4000 |

No database is required to explore the interface. The API and all apps run against a typed, deterministic demo repository. Set `NEXT_PUBLIC_API_URL=http://localhost:4000` to use the HTTP API adapter.

### Verify the repository

```bash
npm run typecheck        # TypeScript across apps, packages and services
npm run test:unit        # Domain, API, indexer, valuation, documents, notifications
npm run test:contracts   # Rust unit tests for every Soroban contract
npm run build            # Production builds for all five apps and services
npm run contracts:build  # Optimised WASM artifacts
```

### PostgreSQL mode

```bash
cp .env.example .env
# Set DATABASE_URL, DEMO_MODE=false and a strong API_KEY
createdb aerospace_rwa
npm run db:migrate
DEMO_SEED=true npm run db:seed   # demo rows, explicitly tagged as demo
npm run dev:api
```

The schema is in [`infrastructure/database/migrations`](infrastructure/database/migrations). The API refuses write operations in demo mode and requires an API key for issuer/admin routes.

### Soroban contracts

```bash
npm run contracts:fmt
npm run contracts:clippy
npm run test:contracts
npm run contracts:build
```

WASM artifacts are written to `contracts/target/wasm32v1-none/release/`. Deployment is **not automatic**. Read [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) before deploying to Testnet.

---

## Repository layout

```text
aerospace-rwa/
├── apps/
│   ├── web/                     # Public platform, marketplace and asset pages
│   ├── investor-portal/         # Investor workspace
│   ├── issuer-portal/           # Issuer workspace
│   ├── admin-portal/            # Platform administration
│   └── operations-portal/       # Asset operations
├── contracts/
│   ├── access-control/          # Shared role model
│   ├── asset-registry/          # Evidence-linked asset identity
│   ├── compliance/              # Investor eligibility and jurisdictions
│   ├── rwa-token/               # SEP-0057-aligned regulated token
│   ├── investment/              # Offering subscriptions and settlement
│   ├── escrow/                  # Conditional value transfer
│   ├── revenue-distribution/    # Per-epoch revenue claims
│   ├── leasing/                 # Lease schedule and rent collection
│   ├── marketplace/             # Allowance-based secondary market
│   └── governance/              # Protocol proposals and voting
├── packages/
│   ├── shared-types/            # Domain model + demo dataset
│   ├── design-system/           # Brand, React components and tokens
│   ├── api-client/              # Typed API client + offline demo adapter
│   ├── stellar-sdk/             # Network config, formatting, explorer links
│   ├── wallet/                  # Freighter integration and wallet state
│   └── validation/              # Zod schemas shared by API and clients
├── services/
│   ├── api/                     # Fastify HTTP API
│   ├── indexer/                 # Soroban RPC event indexer
│   ├── oracle-adapters/         # Signed external valuation adapters
│   ├── valuation/               # Lease DCF and risk-adjusted valuation
│   ├── document-verification/   # Evidence manifests and SHA-256
│   └── notifications/           # Transactional notifications
├── infrastructure/
│   ├── database/                # PostgreSQL migrations and seeds
│   ├── docker/                  # Local and deployment compose files
│   ├── monitoring/              # Prometheus, alerts and dashboards
│   └── deployment/              # Environment and runbook assets
├── docs/                        # Product, protocol, compliance and ADRs
├── e2e/                         # Playwright end-to-end specs
└── .github/workflows/           # CI and CodeQL
```

---

## Protocol modules

| Contract | Responsibility | Key invariant |
| --- | --- | --- |
| `asset-registry` | Evidence-linked identity, category, ownership and lifecycle | An asset cannot become `Verified` without a document digest and an issuer |
| `compliance` | Investor verification, tier, jurisdiction and expiry | No transfer or subscription to an ineligible wallet |
| `rwa-token` | Regulated token balances, allowances, freezes and pauses | Every mint/transfer checks compliance and token state |
| `investment` | Offering terms, subscriptions, caps and refunds | Funds cannot be withdrawn unless the offering is funded and closed |
| `escrow` | Buyer/seller/arbiter conditional settlement | Release requires the configured authorisation and funded balance |
| `revenue-distribution` | Epoch-based distributions and claims | A wallet can claim an epoch once and only its recorded allocation |
| `leasing` | Rent schedule, payment and default state | Rent is only accepted for an active lease and moves the due date |
| `marketplace` | Allowance-based secondary listings | Settlement is atomic; cancellation leaves custody with the seller |
| `governance` | Council proposals and voting | Voting is one member, one vote, with quorum and timelock |

All contracts use explicit storage keys, checked arithmetic and role-gated administration. They are independently tested and integration-tested against Stellar asset contracts. Contract event publication is a documented production gap; see `docs/PROTOCOL.md`.

---

## Compliance and legal boundary

The token is **not** the asset. Depending on the structure, a token represents defined economic rights over a bankruptcy-remote vehicle, lease cash flows, service capacity or verified inventory — never an automatic claim of ownership.

Before any production deployment, each structure requires:

- A jurisdiction-specific legal opinion on the issuer vehicle and token rights.
- An offering memorandum or private placement memorandum.
- Eligibility, residency and transfer restrictions enforced by the compliance contract.
- Custody, insolvency-remoteness and perfection analysis.
- AML/KYC and sanctions controls compatible with the issuer's regulated activity.
- Independent audit of the asset, evidence package and cash-flow waterfall.
- Smart-contract audit and incident-response plan.

See [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md), [`docs/DEMO_MODE.md`](docs/DEMO_MODE.md) and [`SECURITY.md`](SECURITY.md). Nothing here is legal, tax or investment advice.

---

## Security

- Report vulnerabilities privately via the process in [`SECURITY.md`](SECURITY.md).
- Never commit funded Stellar secret keys. Deployment scripts read keys from the local Stellar CLI keystore.
- Demo mode is designed to be safe: it produces no signed transactions and no on-chain writes.
- Contract code is unaudited until an independent audit is completed and published.

---

## Roadmap

| Phase | Outcome |
| --- | --- |
| **01 — Foundation** | Repository, brand, architecture, data model, threat model, docs |
| **02 — Core protocol** | Registry, compliance, token, investment, escrow, revenue, roles |
| **03 — Marketplace** | Issuer onboarding, marketplace, wallet connection, portfolios |
| **04 — Operations** | Leasing, maintenance, insurance, valuations, oracle adapters |
| **05 — Multi-vertical** | Aviation, space, manufacturing, drones, cross-vertical listings |
| **06 — Institutional production** | Audits, legal review, custody, monitoring, mainnet, pilot issuer |

The current repository implements the foundation, protocol reference, application surfaces and operations scaffolding. Production readiness requires the independent controls listed above. See [`docs/ROADMAP.md`](docs/ROADMAP.md), [`docs/API.md`](docs/API.md), [`docs/OPERATIONS.md`](docs/OPERATIONS.md) and [`docs/TESTING.md`](docs/TESTING.md).

---

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md). By participating you agree to the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Apache License 2.0. See [`LICENSE`](LICENSE).

---

**AEROSPACE RWA** — *Financing the infrastructure beyond Earth.*
