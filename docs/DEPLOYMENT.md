# Deployment

The repository is a reference implementation. Nothing is deployed by CI, and no
contract is deployed automatically.

## Local containers

```bash
docker compose -f infrastructure/docker/docker-compose.yml up --build
```

This starts PostgreSQL, the API, and the public web app. Add `--profile portals`
to start all four portals. Docker is not required for the demo mode; the default
`npm run dev` path uses the in-memory repository.

## Contracts

```bash
rustup target add wasm32v1-none
npm run contracts:build
export STELLAR_NETWORK=testnet
export STELLAR_SOURCE=<stellar-cli-identity>
./scripts/deploy-contracts.sh
```

The deployment script writes
`infrastructure/deployment/deployments.<network>.json`. Review every address on
Stellar Expert before committing it. Mainnet additionally requires
`STELLAR_ALLOW_MAINNET=true` and the controls below.

## Production gate

Do not describe an environment as live until all of these are true:

- [ ] Independent legal opinion for each structure and jurisdiction.
- [ ] Offering memorandum / private placement memorandum.
- [ ] Independent smart-contract audit, with findings closed.
- [ ] Multisig administration for every privileged contract role.
- [ ] Verified USDC issuer and settlement asset addresses.
- [ ] KYC/KYB, sanctions and transaction-monitoring vendors integrated.
- [ ] Evidence custody, IPFS pinning and retention policy.
- [ ] Indexer replay, monitoring and incident-response runbooks tested.
- [ ] API keys, database credentials and signing keys in a secret manager.
- [ ] Backup, restore and disaster-recovery exercises completed.

Until then, keep every surface labelled demo or testnet.

See [infrastructure/deployment/README.md](../infrastructure/deployment/README.md)
for the operational steps.
