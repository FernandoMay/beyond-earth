# Demo mode

Demo mode makes the reference implementation safe to explore. It is the default
for every application and for the API.

## What is demo data

- All six asset structures, their valuations, documents, offerings, leases,
  maintenance records, insurance policies, distributions and tasks.
- The investor profile and holdings.
- Compliance cases and the operations queue.
- Every digest in `fixtures/demo/` refers to a synthetic file that says so.

The dataset lives in `packages/shared-types/src/demo.ts` and is deterministic.

## What demo mode will not do

- Build, sign or submit a Stellar transaction.
- Accept a subscription.
- Change a compliance decision.
- Write an issuer asset through the API.
- Show a contract address or transaction hash that does not exist.

## Enabling live mode

Only after a reviewed deployment:

```bash
export DEMO_MODE=false
export API_KEY=<strong random secret>
export DATABASE_URL=postgres://...
export STELLAR_NETWORK=testnet
npm run db:migrate
DEMO_SEED=true npm run db:seed   # optional, still labelled demo
npm run dev:api
```

Mainnet requires `STELLAR_ALLOW_MAINNET=true` and the production gate in
[DEPLOYMENT.md](DEPLOYMENT.md).

## Verification

- `npm run test:unit` includes a test that a demo subscription creates no record.
- `e2e/api.spec.ts` asserts the `DEMO_MODE` response.
- The API health response reports `mode` and `repository`.
- `/metrics` exposes `aerospace_api_demo_mode`.
