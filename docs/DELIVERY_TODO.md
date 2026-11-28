# Beyond Earth — Delivery TODO & Status

## Completed

- [x] Stellar Testnet integration (SDK, Horizon, RPC, payments with memo SHIP-S97KF8)
- [x] 12 Soroban contracts deployed to Testnet (manifest in infrastructure/deployment/deployments.testnet.json)
- [x] Wallet-first auth (Freighter challenge/verify, sessions, roles)
- [x] Batch operations with size limits
- [x] Event publication in governance and withdrawals contracts
- [x] File-backed and Postgres-backed indexer stores
- [x] Reconciliation endpoint (DB vs contract)
- [x] Frontend pages: landing, dashboard, vault, withdrawals, reconciliation, stellar-payment
- [x] CI green (format, typecheck, unit tests, builds, contracts)
- [x] Documentation: audit, Sprint 1 backlog, Stellar integration guide

## Pending for final delivery

- [ ] Deploy all 5 portals + API to production/Testnet hosting
- [ ] Configure managed PostgreSQL and run migrations
- [ ] Enable branch protection and require CI
- [ ] Complete E2E real on Testnet (full flow: register, verify, tokenize, offer, invest, settle, claim)
- [ ] Remove remaining demoSnapshot usage in portals (migrate to API)
- [ ] Add Soroban events to all contracts (governance/withdrawals done; others partial)
- [ ] Add Postgres-backed IndexerStore integration in runner
- [ ] Update README with final contract list and deployment instructions
- [ ] Record demo video with Ship It image
- [ ] Submit challenge deliverables (transaction links, commit links)

## Verification

- `npm run format:check` ✅
- `npm run typecheck` ✅
- `npm run test:unit` ✅ (81 tests)
- `npm run test:contracts` ✅
- `npm run build` ✅
- `npm run test:e2e` ✅ (12 tests)
