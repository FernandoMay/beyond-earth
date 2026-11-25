# Compliance

Compliance is a protocol concern, not a PDF attached to a landing page.

## Investor eligibility

The compliance contract stores an investor record with:

- verification tier (1–4, with 0 reserved for ineligible);
- jurisdiction;
- status (`Pending`, `Approved`, `Suspended`, `Expired`);
- expiry timestamp;
- last update timestamp.

`is_eligible(investor, required_tier, jurisdiction)` returns true only when the
record is approved, the tier is sufficient, the record has not expired at the
current ledger time, the jurisdiction matches and the jurisdiction is allowlisted.
The RWA token and investment contract can require this check before a mint,
transfer or subscription.

## Asset review

An asset cannot become `Verified` unless the reviewer supplies the same evidence
hash that the issuer registered. This prevents a silent document swap between
review and tokenization. `mark_tokenized` requires a verified asset; activation,
suspension and retirement follow explicit transitions.

## Evidence

- Every evidence file has a SHA-256 digest.
- A manifest records names, media types, versions and optional IPFS CIDs.
- Verification reports missing, modified, duplicate and unexpected files.
- Demo evidence is synthetic and labelled; `npm run demo:hash` checks that the
  demo dataset's digests match the files in `fixtures/demo/`.

## Transfer restrictions

Eligibility is re-checked on every transfer, not only at onboarding. The token
administrator can configure the compliance contract, required tier and
jurisdiction. Disabling the hook is a privileged action and should be removed or
timelocked in production.

## What this repository does not provide

This is not a compliance program. A production platform still needs:

- jurisdiction-specific legal advice and an offering memorandum;
- KYC/KYB, sanctions and PEP screening with auditable vendors;
- AML transaction monitoring and suspicious-activity reporting;
- investor classification and appropriateness checks;
- recordkeeping, privacy and data-retention controls;
- independent audits of the vehicle, evidence and contracts.

Nothing in this repository is legal, tax or investment advice.
