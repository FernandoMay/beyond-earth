# Stellar Testnet Integration

Aerospace RWA connects to Stellar Testnet through `@aerospace/stellar-sdk`, the API service, and the public web app.

## Environment variables

- `STELLAR_NETWORK=testnet`
- `STELLAR_RPC_URL=https://soroban-testnet.stellar.org`
- `STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org`
- `STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015`
- `STELLAR_PAYMENT_SECRET_KEY` — funded testnet source secret key (never commit)
- `STELLAR_PAYMENT_DESTINATION` — destination account for the challenge payment
- `STELLAR_PAYMENT_AMOUNT` — amount in XLM (default `1`)
- `STELLAR_PAYMENT_MEMO` — memo text (default `SHIP-S97KF8`)

Contract IDs are recorded in `infrastructure/deployment/deployments.testnet.json` after running `npm run contracts:build` and `scripts/deploy-contracts.sh`.

## API endpoints

- `POST /v1/stellar/testnet-payment` — sends a native XLM payment with the challenge memo.
- `GET /v1/stellar/accounts/:address` — reads an account from Horizon.
- `GET /v1/stellar/transactions/:hash` — reads a transaction from Horizon.
- `GET /v1/stellar/soroban/:contractId/:method` — simulates a read-only Soroban contract call.
- `POST /v1/stellar/soroban/invoke` — signs and submits a Soroban contract invocation.

## Verified Testnet transaction

- Payment: https://stellar.expert/explorer/testnet/tx/c3268c18da8888344b34c33c39bfb487f7a98dc97f66d6d9436d85f63b3660e4
- Memo: `SHIP-S97KF8`

## Web app

Open `/stellar-payment` in the web app to send the payment and interact with the deployed asset registry contract.
