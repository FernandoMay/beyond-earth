# 0005. Tokens represent defined rights, not automatic title

- Status: Accepted
- Date: 2026-01-27

## Context

"Tokenized asset" is often used to imply that a token is the asset or conveys
automatic ownership. That is legally inaccurate for most aerospace structures.

## Decision

A token represents a defined economic or contractual right created by a legal
vehicle. The rights description is hashed and stored with the token metadata.
The UI and documentation state that the token is not automatic title and that
the legal agreement governs.

## Consequences

- Each structure needs a legal opinion and an offering document.
- Token metadata includes an asset id and rights hash.
- Transfer restrictions and eligibility are enforced separately from ownership.
- Marketing language must never describe a token as owning an aircraft, engine,
  satellite or other asset.
