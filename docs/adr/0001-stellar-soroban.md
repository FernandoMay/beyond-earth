# 0001. Stellar and Soroban as the settlement and contract layer

- Status: Accepted
- Date: 2026-01-15

## Context

Aerospace assets need a settlement network that supports regulated token
issuance, low-cost transfers, stable-value settlement and auditable contract
state. The platform must be understandable to institutional partners and must
not depend on a speculative native token.

## Decision

Use Stellar for accounts, assets and settlement, and Soroban for the protocol
contracts. USDC is the reference settlement asset. Contract state is the
authoritative record for token balances, offerings, escrow and claims;
PostgreSQL remains the operational system of record for evidence and workflow.

## Consequences

- Accounts and transfers use Stellar primitives and SEP-41-style token methods.
- The API and indexer talk to Soroban RPC and Horizon.
- Contract upgrades and administration require Stellar key management.
- No proprietary chain or speculative platform token is required.

## Alternatives considered

- EVM chain with ERC-3643: mature token standard, but introduces gas volatility
  and a different institutional settlement model.
- Permissioned centralized ledger: simpler operations, weaker independent
  verifiability and settlement transparency.
