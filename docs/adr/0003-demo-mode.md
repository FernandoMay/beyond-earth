# 0003. Demo mode is the default and never signs transactions

- Status: Accepted
- Date: 2026-01-22

## Context

A reference implementation must be safe to explore. A convincing UI that can
accidentally move value, or that implies a transaction occurred when it did not,
is unacceptable.

## Decision

All applications default to demo mode. The API returns a `DEMO_MODE` response
for subscriptions and blocks compliance decisions and issuer writes. Demo mode
does not construct, sign or submit a Stellar transaction. The UI shows persistent
demo/testnet labels and omits contract addresses until a real deployment
manifest exists.

## Consequences

- Write endpoints require `DEMO_MODE=false`, an API key and a configured
  repository.
- Demo data remains deterministic and explicitly illustrative.
- Enabling live mode is an explicit deployment decision with its own review.
