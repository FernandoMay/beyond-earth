# 0002. Evidence-linked assets and SHA-256 manifests

- Status: Accepted
- Date: 2026-01-20

## Context

Aerospace assets are expensive, long-lived and document-heavy. A registry entry
without reproducible evidence is not useful to an investor, auditor or operator.

## Decision

Every asset record links to a document manifest. Each document has a SHA-256
digest of the exact evidence bytes, a version and an optional IPFS CID. The
asset registry stores the evidence hash that was reviewed. Verification fails if
the hash does not match.

Demo evidence lives in `fixtures/demo/`; `npm run demo:hash` proves that the
digests embedded in the demo dataset match those files.

## Consequences

- Evidence is content-addressed and can be re-verified independently.
- Replacing a document requires a new manifest version and a new review.
- IPFS is optional; the digest is the primary integrity mechanism.
- Synthetic demo files are visibly marked and are never production evidence.
