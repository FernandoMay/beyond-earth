# 0006. Compliance-gated token transfers

- Status: Accepted
- Date: 2026-02-01

## Context

Eligibility is not a one-time onboarding check. Investors expire, jurisdictions
change and sanctions lists update. A transfer to an ineligible wallet can breach
offering restrictions.

## Decision

The RWA token can be configured with a compliance contract, a required tier and
a jurisdiction. Both sender and recipient are checked before mint or transfer.
The compliance contract evaluates status, tier, expiry and jurisdiction at the
current ledger time.

## Consequences

- Transfers fail atomically when either side is ineligible.
- The compliance contract becomes a critical dependency; its admin must be
  protected and monitored.
- Token administrators can disable the hook, which is a privileged action and
  should be removed or timelocked for production.
