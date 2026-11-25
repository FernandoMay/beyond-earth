# Testing

## Commands

```bash
npm run typecheck
npm run test:unit
npm run test:contracts
npm run contracts:clippy
npm run format:check
npm run build
npm run test:e2e
```

`test:e2e` requires Playwright browsers:

```bash
npx playwright install chromium
```

## What is covered

### TypeScript

- Domain demo dataset and formatting.
- Zod request schemas.
- Stellar network config, address validation and exact amount parsing.
- Wallet network guard.
- API client demo adapter and demo subscription guard.
- Fastify routes: reads, validation, demo write guards, API-key auth, idempotent
  subscriptions, live-mode writes.
- Indexer ordering, duplicates, failure recovery and serialization.
- Oracle signature, source, freshness, future-skew and band checks.
- Valuation math, haircuts and warnings.
- Evidence manifest creation and verification.
- Notification rendering, environment labels and idempotent delivery.

### Rust

Every contract has unit tests for happy paths, authorisation failures, invalid
inputs and state transitions. Stellar Asset Contracts are used for settlement
tests; the compliance contract is deployed for token and investment integration
tests.

### End-to-end

Playwright specs check the public site, all four portals, demo labels and the API
demo guard.

## Not covered

- A full Stellar Testnet deployment test.
- Browser wallet signing with Freighter.
- Load, fuzz and invariant testing of the contracts.
- A database integration test against a live PostgreSQL instance in CI.
- Accessibility and visual regression suites.

These are production-readiness gaps, not implied guarantees.
