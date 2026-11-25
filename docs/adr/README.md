# Architecture decision records

ADRs capture decisions that are expensive to reverse. Add a numbered file and
update this index in the same pull request.

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-stellar-soroban.md) | Stellar and Soroban as the settlement and contract layer | Accepted |
| [0002](0002-evidence-linked-assets.md) | Evidence-linked assets and SHA-256 manifests | Accepted |
| [0003](0003-demo-mode.md) | Demo mode is the default, and it never signs transactions | Accepted |
| [0004](0004-no-governance-token.md) | No speculative governance token at launch | Accepted |
| [0005](0005-token-rights.md) | Tokens represent defined rights, not automatic title | Accepted |
| [0006](0006-compliance-gated-transfers.md) | Compliance-gated token transfers | Accepted |
| [0007](0007-jsonb-operational-records.md) | JSONB payloads with indexed operational columns | Accepted |
| [0008](0008-indexer-idempotency.md) | Idempotent, ordered indexer processing | Accepted |

## Template

```md
# NNNN. Title

- Status: Proposed | Accepted | Superseded by NNNN
- Date: YYYY-MM-DD
- Deciders: ...

## Context

## Decision

## Consequences

## Alternatives considered
```
