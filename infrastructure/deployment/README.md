# Deployment

No contract is deployed by CI. Deployment is an explicit, reviewed operation.

## 1. Build artifacts

```bash
rustup target add wasm32v1-none
npm run contracts:build
```

The build uses `contracts/target/wasm32v1-none/release/*.wasm`. Review the diff
and run `npm run test:contracts` and `npm run contracts:clippy` first.

## 2. Deploy to Testnet

```bash
export STELLAR_NETWORK=testnet
export STELLAR_SOURCE=<stellar-cli-identity>
./scripts/deploy-contracts.sh
```

The script writes `infrastructure/deployment/deployments.testnet.json`. Commit
that manifest only after verifying every contract address on Stellar Expert.

## 3. Mainnet

Mainnet is blocked unless both are set:

```bash
export STELLAR_NETWORK=mainnet
export STELLAR_ALLOW_MAINNET=true
```

A mainnet deployment additionally requires an independent security review,
multisig administration, verified USDC issuer addresses and a signed compliance
opinion. This repository does not assert that any of those exist.

## 4. Environment

Populate the contract ids from the manifest into the API environment. Until the
manifest exists, the UI intentionally shows no addresses or transaction hashes.
