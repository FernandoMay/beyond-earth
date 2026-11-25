# Production Readiness Audit & Live-Testnet Migration Plan

> **Audit date:** 2026-11-25  
> **Repository:** [FernandoMay/beyond-earth](https://github.com/FernandoMay/beyond-earth)  
> **Reviewed branch:** `main`  
> **Reviewed revision:** [`415b4b016c4c07f8db54a1885186b0f8a94303e9`](https://github.com/FernandoMay/beyond-earth/commit/415b4b016c4c07f8db54a1885186b0f8a94303e9)  
> **Assessment:** Reference implementation / Testnet-oriented project. **Not production-ready for real-money investment or public securities distribution.**

This document records the repository architecture review, the risks identified in the reviewed code/configuration, the target architecture, and a staged plan to remove silent demo behavior while preserving deterministic fixtures for development and tests.

The review is a point-in-time engineering assessment, not a legal opinion, smart-contract audit, penetration test, custody review, or certification. Findings must be revalidated against the exact commit being changed. A passing test suite does not establish production readiness.

---

## 1. Executive summary

Beyond Earth is structured as a multi-application aerospace real-world-asset (RWA) platform on Stellar and Soroban. The repository contains the major product surfaces and protocol/service building blocks, but the existence of those components does not yet prove that the complete business workflow is connected end to end.

The main gap is between **implemented interfaces and a verified live workflow**:

- Some applications can consume deterministic demo fixtures directly instead of obtaining data from the API.
- Missing API configuration can select a demo adapter rather than fail explicitly.
- Several write paths persist local database state without completing the corresponding Soroban transaction.
- The current server-side Soroban invocation path presents a privileged signing/key-management risk and must not be exposed as a general-purpose browser operation.
- The investor lookup path is not sufficiently scoped to the requesting wallet/user.
- The indexer and service packages exist, but a complete live event-to-database-to-API-to-UI reconciliation flow has not been demonstrated.
- The Netlify configuration deploys the public web application, not all five applications, the API, PostgreSQL, and background workers.
- Documentation and deployment metadata disagree about the number of contracts.
- The latest observed GitHub Actions run failed; the available run summary did not expose enough detail to attribute the cause.

**Recommendation:** do not delete demo fixtures indiscriminately. Keep them isolated for tests and explicit local development. Remove silent demo fallback from production builds and production deployments, and make every live action follow an authenticated, wallet-signed, confirmed, indexed, and reconciled path.

## 2. Repository inventory

The reviewed repository is organized into the following major areas:

### Applications

| Application | Responsibility |
| --- | --- |
| `apps/web` | Public platform, marketplace, asset pages, protocol/compliance content |
| `apps/investor-portal` | Investor onboarding, opportunities, portfolio and distributions |
| `apps/issuer-portal` | Asset onboarding, evidence and offerings |
| `apps/admin-portal` | Registry review, compliance and administrative workflows |
| `apps/operations-portal` | Leasing, maintenance, insurance, oracles and operational tasks |

### Shared packages

The monorepo includes shared packages for domain types, API access, design system, Stellar integration, wallet integration and validation.

### Services

The service layer includes:

- Fastify API
- Soroban/event indexer
- Oracle adapters
- Valuation engine
- Document verification
- Notifications

Some of these are typed libraries intended to run inside an API process or worker; their presence does not by itself establish that a separately deployed, continuously running production service exists.

### Soroban contracts

The repository contains contract directories for:

1. Access control
2. Asset registry
3. Compliance
4. RWA token
5. Investment
6. Escrow
7. Revenue distribution
8. Leasing
9. Marketplace
10. Governance
11. Withdrawals

**Documentation inconsistency:** the root README describes 10 contracts, while the deployment layout/manifest includes an additional withdrawals contract (and access-control needs to be represented consistently). Reconcile the canonical contract inventory, deployment manifest, environment variables, generated client configuration and all UI protocol summaries. Do not hand-maintain competing contract counts.

## 3. Findings and risk register

Severity describes the potential impact if the observed path is reachable in the relevant environment. Re-check the current code and deployment configuration before treating any item as closed.

### P0 — Security and authorization

#### P0.1 — General-purpose server-side Soroban signing surface

The reviewed API contains a Soroban invocation endpoint that accepts a contract identifier, method and arguments from the caller and invokes using a server-held key. The reviewed handler did not establish sufficient authentication/authorization for that privileged operation.

**Risk:** a caller may be able to induce the server to sign or submit operations outside the intended business policy. A server key must never become a generic transaction-signing oracle.

**Required remediation:**

- Remove the arbitrary contract/method invocation capability from browser-accessible routes.
- User-initiated transactions must be built as unsigned XDR, reviewed by the client, signed by the user's Freighter wallet, submitted through the configured Stellar RPC and confirmed.
- Privileged administrative actions must use narrowly scoped authorization policies and multisignature controls; never reuse a general-purpose hot key.
- Add negative tests proving unauthenticated callers cannot invoke privileged actions and that callers cannot select arbitrary contracts/methods/arguments.

#### P0.2 — Wallet-scoped identity and authorization

The reviewed investor endpoint returned a database investor record without adequately binding the result to the requesting wallet/session.

**Risk:** one user could receive another investor's portfolio or account information.

**Required remediation:**

- Introduce wallet challenge authentication (for example, a SEP-10-compatible flow or a carefully designed signed challenge with server-side session management).
- Bind every investor query and write to the authenticated wallet and internal user identity.
- Enforce role checks server-side for issuer, investor, admin and operations actions.
- Add cross-wallet authorization tests for every sensitive endpoint.

#### P0.3 — Fail-open network validation

The wallet integration's network matching logic treated a missing network passphrase as acceptable.

**Risk:** the client may continue when the connected wallet's network cannot be positively verified.

**Required remediation:** fail closed. Require an explicit expected network/passphrase and verify it before building or signing any transaction. Add tests for missing, mismatched and unexpected network configuration.

### P1 — Live workflow and data integrity

#### P1.1 — Demo data is not isolated consistently

The reviewed code showed several demo-data entry points:

- The API client can select a demo adapter when `NEXT_PUBLIC_API_URL` is absent.
- Shared demo snapshots are imported directly by application pages.
- The API can start with demo behavior when configuration is missing.
- Container defaults enable demo mode.
- Some write flows can produce synthetic identifiers or illustrative records.

The README explicitly documents deterministic demo behavior for local exploration. This is acceptable only when it is deliberate and unmistakably labelled.

**Required remediation:**

- Define explicit environments: `development`, `test`, `staging` and `production`.
- Permit demo fixtures only in development/test, or in a separately named and clearly labelled showcase deployment.
- In production, fail startup/build or show a hard configuration error when the live API is missing. Never silently fall back to fixtures.
- Keep test fixtures, factories and deterministic seed data for automated tests.
- If the live marketplace has no verified assets, render a genuine empty state; do not fill it with fictional assets.
- Label every Testnet record as Testnet and every illustrative valuation as illustrative.

#### P1.2 — Subscription is not yet a verified on-chain investment

The reviewed subscription path persisted a `pending_escrow`-style database record and marked it illustrative, but did not complete the full Investment/Escrow Soroban transaction lifecycle with a user wallet signature and confirmed transaction.

**Required remediation:**

1. Validate offering status, eligibility, wallet identity, amount, currency and limits on the server.
2. Build the exact contract call and return unsigned XDR.
3. Have the investor sign with Freighter.
4. Submit the signed transaction to Stellar RPC.
5. Wait for ledger confirmation and capture the transaction hash/result.
6. Index the resulting contract events.
7. Reconcile contract state with the operational database.
8. Only then mark the subscription as confirmed/settled in the UI.

A database row with a pending status is not proof of an investment or escrow deposit.

#### P1.3 — Asset creation and compliance are not proven on-chain

The reviewed asset draft path can create a local draft/synthetic identifier. The compliance decision path appeared to update database state without proving that the corresponding Soroban registry/compliance operation was completed.

**Required remediation:** explicitly separate draft, submitted, under-review, approved, registered-on-chain and rejected states. Each transition must have an authorized actor, audit record, idempotency key and—where applicable—a confirmed transaction hash and contract state check.

#### P1.4 — PostgreSQL transaction boundary

The reviewed compliance decision path used row locking, but the complete read/decision/write sequence was not clearly protected by one atomic database transaction.

**Risk:** concurrent decisions or retries can race and leave inconsistent state.

**Required remediation:** use one database transaction for lock, authorization check, state transition and audit insert. Add concurrency and retry tests.

#### P1.5 — Indexer and reconciliation are not yet demonstrated end to end

The repository includes an indexer with cursor/processed-event concepts, but a complete live Soroban RPC ingestion path and its durable operational behavior were not established by the reviewed evidence.

**Required remediation:**

- Persist a ledger/event cursor.
- Make event processing idempotent using stable event identifiers.
- Handle retries, partial batches, reorg/rollback semantics where applicable, and replay from a known ledger.
- Store raw event evidence and normalized domain records.
- Reconcile indexed state against contract reads.
- Alert on cursor lag, failures and reconciliation mismatches.
- Prove the flow from Soroban event → indexer → PostgreSQL → API → UI in automated E2E tests.

#### P1.6 — Evidence verification is not legal asset verification

A document hash or IPFS content reference proves the identity of bytes, not ownership, title, lien status, authenticity, custody or legal enforceability of the underlying aerospace asset.

**Required remediation:** separate technical integrity checks from independent legal, registry, valuation, insurance and custody review. Never label an asset legally verified solely because its files hash correctly.

### P1 — Deployment and operations

#### P1.7 — Hosting configuration does not deploy the complete platform

The reviewed Netlify configuration builds the public `apps/web` application. It does not deploy all four other Next.js portals, the Fastify API, PostgreSQL or continuously running workers.

**Required remediation:** deploy each application and service deliberately, with independent health checks and environment configuration. Suggested topology:

| Component | Deployment responsibility |
| --- | --- |
| Public web / marketplace | Next.js hosting |
| Investor portal | Separate protected application deployment |
| Issuer portal | Separate protected application deployment |
| Admin portal | Private/restricted deployment, strong authentication |
| Operations portal | Private/restricted deployment, strong authentication |
| Fastify API | Persistent server/container with TLS and health checks |
| PostgreSQL | Managed database, backups and restore testing |
| Indexer / notifications | Persistent worker process with monitoring |
| Soroban RPC | Configured provider with timeouts, retries and observability |

Configure production CORS with the exact deployed origins. The reviewed server configuration was limited to local origins while an environment variable for CORS origins was documented but not consistently applied. Ensure the API binds to the production interface (not loopback-only) behind the hosting platform's network controls.

#### P1.8 — Environment and contract configuration drift

The deployment manifest, `.env.example`, deployment scripts and UI contract summaries do not represent every contract/configuration value consistently.

**Required remediation:**

- Make the deployment manifest the canonical source for deployed contract IDs, network, deployment transaction, WASM hash and deployment metadata.
- Generate typed app/service configuration from that manifest.
- Validate required contract IDs at startup.
- Fail closed on missing or mismatched network/contract configuration.
- Never silently substitute placeholder IDs in a live environment.

#### P1.9 — CI failure and branch protection

The latest observed GitHub Actions run at the time of this review was [run #26](https://github.com/FernandoMay/beyond-earth/actions/runs/45547425043), and the run summary showed failures in formatting, TypeScript/unit/build and Soroban contract jobs. The available run evidence did not expose enough log detail to identify the root cause; no specific cause is asserted here.

**Required remediation:**

- Inspect and fix the actual logs for each failed job.
- Rerun the full workflow on the current HEAD.
- Require formatting, typecheck, unit, API integration, contract and E2E checks before merge.
- Enable branch protection and require review/status checks.
- Keep test results tied to the exact commit SHA.

Previously reported passing test counts on an older revision are historical evidence only. They must not be presented as proof that the current revision passes.

## 4. Target architecture

The target production-like Testnet architecture should make the trust boundaries explicit:

```text
Five Next.js applications
  ├── Public marketplace
  ├── Investor portal
  ├── Issuer portal
  ├── Admin portal (restricted)
  └── Operations portal (restricted)
             │
             ▼
Authenticated Fastify API
  ├── Wallet challenge/session authentication
  ├── Role and resource authorization
  ├── Domain validation and idempotency
  ├── Unsigned transaction construction
  └── Read models and audit trail
             │
       ┌─────┴──────────┐
       ▼                ▼
 PostgreSQL        Soroban RPC
 operational DB        │
       ▲                ▼
       └──── Indexer ◄──┘
          ├── durable cursor
          ├── idempotent event store
          ├── replay/reconciliation
          └── monitoring/alerts

Browser wallet (Freighter)
  └── signs user transactions; private keys remain with the user
```

The API must not hold or expose a general-purpose user signing key. Any exceptional protocol administration signer must be isolated, policy-constrained, multisig-controlled and unavailable to normal application request handlers.

## 5. Demo Mode deprecation policy

**Do not remove fixtures from the repository. Deprecate implicit demo behavior in live environments.**

| Environment | Demo fixtures | Live API | Writes |
| --- | --- | --- | --- |
| Unit/integration tests | Allowed and deterministic | Optional/mocked by test design | Test-only |
| Local development | Allowed when explicitly enabled | Optional | Clearly labelled local/demo |
| Showcase/demo deployment | Allowed only with visible demo labels | Optional | No claim of real investment |
| Staging/Testnet | Disabled by default; explicit fixture use only for isolated tests | Required | Real wallet signature and Testnet confirmation |
| Production/Mainnet | Forbidden | Required | Authenticated, authorized and confirmed on-chain workflow |

Acceptance rules:

- A missing API URL in production must produce a clear error, not a demo adapter.
- A missing required database/RPC/contract configuration must fail health checks or startup.
- No `DEMO-DRAFT-*` or equivalent synthetic ID may be represented as a live asset.
- No pending database record may be represented as a completed investment.
- Empty live datasets must render empty states.
- Demo fixtures must never be included in production API responses.

## 6. Implementation roadmap

Use a dedicated migration branch and small, reviewable pull requests. Suggested branch: `feat/live-testnet-migration`. The audit document itself is kept on a documentation branch until reviewed.

### Sprint 0 — Security baseline

- [ ] Remove or lock down arbitrary server-side Soroban signing/invocation.
- [ ] Add wallet challenge authentication and server-side session handling.
- [ ] Add role/resource authorization to sensitive endpoints.
- [ ] Scope investor reads and writes to authenticated wallet identity.
- [ ] Make network validation fail closed.
- [ ] Add security regression tests for cross-wallet access and privileged routes.
- [ ] Review secrets, CORS, host binding and production environment validation.

**Exit criteria:** no browser-accessible generic signing key; unauthorized and cross-wallet requests fail; missing network configuration fails closed.

### Sprint 1 — Production data foundation

- [ ] Make demo selection explicit and environment-gated.
- [ ] Remove direct demo snapshot imports from production application paths.
- [ ] Require the live API in staging/production.
- [ ] Complete PostgreSQL migrations, constraints, transaction boundaries and indexes.
- [ ] Add authenticated resource-scoped API queries.
- [ ] Add auditable state transitions and idempotency keys.
- [ ] Add genuine empty states for unseeded live data.

**Exit criteria:** all five apps obtain operational data through the authenticated API; demo data cannot leak into staging/production.

### Sprint 2 — Soroban transaction lifecycle

- [ ] Reconcile all contract interfaces, IDs and deployment metadata.
- [ ] Implement asset registration through the intended registry contract.
- [ ] Implement compliance transitions with explicit roles and contract state.
- [ ] Implement offering creation/activation.
- [ ] Implement investment and escrow with unsigned XDR + Freighter signing.
- [ ] Persist transaction hash, ledger, status and failure reason.
- [ ] Implement withdrawal and distribution flows with authorization and accounting controls.
- [ ] Test wrong network, insufficient balance, expired offering, duplicate submit and failed transaction cases.

**Exit criteria:** a user can complete a real Testnet transaction from the application wallet flow; the UI only reports success after ledger confirmation and state reconciliation.

### Sprint 3 — Indexer and reconciliation

- [ ] Connect to the configured Soroban RPC provider.
- [ ] Persist ledger/event cursor and processed event identifiers.
- [ ] Add idempotent event handlers and replay support.
- [ ] Normalize contract events into database read models.
- [ ] Reconcile critical balances, subscriptions, ownership and offering state against contract reads.
- [ ] Add monitoring, lag/failure alerts and operational runbooks.

**Exit criteria:** a confirmed Testnet transaction appears correctly in every relevant portal after indexing, and replay does not duplicate records.

### Sprint 4 — Migrate all applications

- [ ] Public marketplace and asset detail.
- [ ] Investor onboarding, opportunities, portfolio and distributions.
- [ ] Issuer asset/evidence/offering pipeline.
- [ ] Admin review, compliance, registry and audit.
- [ ] Operations leases, maintenance, insurance, oracles and tasks.
- [ ] Remove production imports of fixtures and demo-only actions.
- [ ] Add loading, error, empty, pending, confirmed and rejected states consistently.

**Exit criteria:** each visible action has a real API/contract behavior or is explicitly labelled unavailable; no dead-end or fake-success action remains.

### Sprint 5 — Deployment and verification

- [ ] Deploy all five applications.
- [ ] Deploy API, managed PostgreSQL and persistent workers.
- [ ] Configure exact CORS origins, secrets and network settings.
- [ ] Add health/readiness endpoints and monitoring.
- [ ] Verify backups and perform a restore exercise.
- [ ] Run full CI on the release commit.
- [ ] Run the complete cross-application Testnet E2E.
- [ ] Publish deployment addresses and evidence with exact commit/transaction references.

**Exit criteria:** reproducible deployment, passing release checks, operational monitoring and a complete evidence trail.

## 7. Required end-to-end acceptance scenario

The release candidate must demonstrate this workflow with real Testnet state, not mocks:

1. **Issuer:** authenticate wallet, create an asset draft and upload supporting evidence.
2. **Issuer:** submit the asset for review; persist the evidence manifest/hash and audit history.
3. **Admin:** review the evidence and approve/reject with an authorized identity and reason.
4. **Protocol:** register the approved asset and verify the resulting Soroban state.
5. **Issuer:** create an offering with validated terms and lifecycle.
6. **Investor:** authenticate a separate wallet and pass eligibility checks.
7. **Investor:** subscribe; receive unsigned XDR; sign with Freighter; submit to Testnet.
8. **Soroban:** confirm the transaction and escrow/investment state.
9. **Indexer:** ingest events exactly once and update the operational read model.
10. **Investor portal:** show the confirmed position and transaction evidence.
11. **Issuer/admin:** show matching offering, asset and audit state.
12. **Operations:** show only the operational records supported by actual data.
13. **Reconciliation:** compare critical DB read models against contract reads and report zero unexplained mismatches.

Capture for every step: commit SHA, environment/network, wallet public address, contract ID, transaction hash, ledger, API request/correlation ID, indexed event ID and resulting UI state. Never publish private keys, seed phrases, session secrets or personal KYC documents in the evidence pack.

## 8. Documentation and configuration work

Keep the following documents aligned with implementation:

- `README.md` — current status, contract count, environment boundaries and truthful quick start.
- `docs/ARCHITECTURE.md` — trust boundaries, deployed topology and signer model.
- `docs/PROTOCOL.md` — canonical contract inventory, interfaces and lifecycle.
- `docs/API.md` — authentication, authorization, request/response and error semantics.
- `docs/DEMO_MODE.md` — explicit fixture policy and production prohibition.
- `docs/DEPLOYMENT.md` — all applications, API, database and workers.
- `docs/TESTING.md` — commands, coverage scope and release gates.
- `docs/OPERATIONS.md` — monitoring, replay, reconciliation and incident response.
- `docs/COMPLIANCE.md` — technical controls vs external legal/compliance obligations.
- `infrastructure/deployment/deployments.<network>.json` — canonical deployment metadata.

Additional useful documents:

- `docs/GO_LIVE_CHECKLIST.md`
- `docs/INTEGRATION_E2E.md`
- `docs/DATA_MIGRATION.md`
- `docs/SECURITY_RUNBOOK.md`

## 9. Release checklist

### Security

- [ ] No generic server-side signing endpoint is reachable by browser users.
- [ ] Wallet authentication is challenge-based and replay-resistant.
- [ ] Every sensitive resource is scoped to the authenticated identity.
- [ ] Role checks are enforced server-side.
- [ ] Network and contract configuration fail closed.
- [ ] Secrets are stored outside source control and browser bundles.
- [ ] Privileged contract administration is multisig/policy controlled.

### Data and API

- [ ] Production has no demo adapter or fixture fallback.
- [ ] Database migrations and constraints are applied.
- [ ] State transitions are transactional and auditable.
- [ ] Writes are idempotent.
- [ ] Investor/issuer/admin/operations data is correctly scoped.
- [ ] Empty, pending, failed and confirmed states are distinct.

### Stellar and Soroban

- [ ] Contract inventory and deployment manifest agree.
- [ ] Every required contract is deployed to the intended network.
- [ ] Contract IDs and WASM hashes are verified.
- [ ] User operations are signed by the user's wallet.
- [ ] UI success requires ledger confirmation.
- [ ] Indexer replay and reconciliation are tested.
- [ ] No Testnet evidence is represented as Mainnet or production settlement.

### Applications and operations

- [ ] All five applications are deployed and use the intended API.
- [ ] Admin and operations surfaces are access-restricted.
- [ ] API, database and workers have health checks and monitoring.
- [ ] CORS and host binding match deployed infrastructure.
- [ ] Backups and restore procedures are tested.
- [ ] CI checks are required before merge.
- [ ] Release E2E evidence is attached to the exact release commit.

### External readiness (not established by this code audit)

- [ ] Independent legal analysis for each asset structure and jurisdiction.
- [ ] KYC/KYB, sanctions screening and transaction monitoring.
- [ ] Custody, asset control, insurance and servicing arrangements.
- [ ] Independent smart-contract security audit and closure of findings.
- [ ] Valuation methodology and independent review.
- [ ] Offering documents and investor disclosures.
- [ ] Data privacy, retention and incident response review.

## 10. Current conclusion

Beyond Earth has a substantial reference architecture and a broad set of application, service and Soroban components. The next milestone should not be described as “remove demo mode” alone: it is a controlled migration from a demo-capable reference implementation to a fully connected, authenticated and observable **Testnet workflow**.

The immediate priority is to close the P0 security issues before wiring more investment functionality. Then establish the live data foundation, complete the wallet-signed Soroban lifecycle, prove indexer reconciliation, migrate all five applications and deploy the complete topology.

Until the full acceptance scenario and external readiness requirements are independently satisfied, describe the project as a **Testnet/reference implementation**, not as a production securities marketplace or a platform ready to accept real investor funds.

---

## Review notes and evidence boundaries

- This assessment is anchored to the repository revision listed at the top. Re-run the audit after material changes.
- The root README and `docs/ARCHITECTURE.md` describe a deterministic demo path for local development; this document does not recommend deleting that path from tests.
- The latest observed CI run is linked in section 3. Its failure cause was not established from the available run summary.
- The public Netlify site was not visually validated as part of this repository-only review. Hosting conclusions are based on repository deployment configuration, not a claim that every deployed page was manually tested.
- No code, contract, infrastructure or application behavior is changed by this audit document. It records findings and a remediation plan only.
