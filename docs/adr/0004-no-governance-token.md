# 0004. No speculative governance token at launch

- Status: Accepted
- Date: 2026-01-25

## Context

A transferable governance token would add regulatory, securities-law and
governance risk before the platform has a production asset or issuer. It would
also invite speculation unrelated to aerospace asset performance.

## Decision

Governance is a council of approved addresses with one vote per member, explicit
quorum, a voting window and a timelock. No governance token is issued. Any future
change requires a separate legal and governance review.

## Consequences

- Governance power is not purchasable.
- Membership is managed by the contract admin and should be multisig-controlled
  in production.
- Proposal execution is recorded on-chain by decision hash and performed through
  a reviewed operations runbook.
