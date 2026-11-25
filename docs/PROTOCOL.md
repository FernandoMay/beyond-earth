# Protocol

Ten Soroban contracts implement the reference protocol. They use explicit storage
keys, checked arithmetic, role-gated administration and typed errors. Contracts
do not custody legal title; they record and enforce defined economic rights.

| Contract | Crate | Core functions |
| --- | --- | --- |
| Access control | `aerospace-access-control` | `initialize`, `grant`, `revoke`, `has_role` |
| Asset registry | `aerospace-asset-registry` | `register_asset`, `verify_asset`, `mark_tokenized`, `set_status` |
| Compliance | `aerospace-compliance` | `set_jurisdiction`, `approve_investor`, `suspend_investor`, `is_eligible` |
| RWA token | `aerospace-rwa-token` | `initialize`, `mint`, `burn`, `transfer`, `transfer_from`, `configure_compliance` |
| Investment | `aerospace-investment` | `create_offering`, `subscribe`, `settle`, `mark_failed`, `claim_refund` |
| Escrow | `aerospace-escrow` | `create_escrow`, `dispute`, `release`, `refund` |
| Revenue distribution | `aerospace-revenue-distribution` | `create_distribution`, `allocate`, `claim`, `close` |
| Leasing | `aerospace-leasing` | `create_lease`, `pay_rent`, `flag_arrears`, `default_lease` |
| Marketplace | `aerospace-marketplace` | `create_listing`, `fill`, `cancel` |
| Governance | `aerospace-governance` | `add_member`, `propose`, `vote`, `finalize`, `execute` |

## Invariants

- An asset cannot be verified without matching evidence bytes.
- A token mint or transfer fails if either side is ineligible under the configured
  compliance policy.
- A subscription below the minimum ticket or outside the offering window fails.
- Settlement is only possible for a funded offering after its close.
- A failed offering refunds each position once.
- A distribution claim is pro-rata to recorded units and can happen once.
- Marketplace payment and token delivery settle atomically.
- Governance is one member, one vote, with quorum and timelock.
- The owner's admin role cannot be revoked in the access-control contract.

## Token model

The token is SEP-41-style: balances, allowances, `transfer`, `transfer_from`,
`burn`, `burn_from`, metadata and total supply. Metadata includes the asset id and
a SHA-256 hash of the rights description. The token does not include a claim that
the holder owns the aircraft, engine, satellite or other asset.

## Settlement

Investment, escrow, distribution and marketplace contracts accept any Stellar
asset contract, including USDC. Amounts are integer base units; decimals come from
the settlement asset. The reference tests use a Stellar Asset Contract (SAC).

## Events and indexing

State-changing functions are the integration surface. The indexer is designed to
consume contract events with ledger ordering, idempotent event ids and a durable
cursor. Event publication should be enabled and covered by integration tests
before a production deployment; the reference contract tests focus on state
transitions and authorisation.

## Administration

Production administration should be a multisig account. The reference contracts
accept a single admin or owner address for clarity. A production deployment must
replace single-key control, add contract upgrade policy and publish an incident
runbook.
