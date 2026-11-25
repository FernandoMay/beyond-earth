# Security Policy

## Scope

This repository is a reference implementation. It is **not** a production custody or trading system. Still, security defects in contracts, authorisation, data handling or deployment scripts matter and should be reported responsibly.

## Reporting a vulnerability

**Do not open a public GitHub issue for a security vulnerability.**

Send a private report to the maintainers through GitHub Security Advisories for this repository (Security → Report a vulnerability). Include:

- Affected component and version/commit.
- A reproducible description or proof of concept.
- Impact assessment (funds, eligibility bypass, data exposure, denial of service).
- Suggested remediation, if known.
- Whether the issue is already public.

We aim to acknowledge reports within 3 business days and provide a remediation plan within 10 business days. Please allow time for a fix before public disclosure.

## Safe harbour

We support good-faith security research that:

- Tests only against local or Testnet deployments you control.
- Does not access other users' data or systems.
- Does not exfiltrate funds, keys or personal data.
- Does not perform denial-of-service or social-engineering attacks.

## Security model

- **No secrets in the repository.** Stellar keys live in the local CLI keystore or an external secret manager.
- **No real value in demo mode.** Demo mode never signs a transaction or writes on-chain.
- **Authorisation is explicit.** Each state-changing contract function authenticates the relevant address and role.
- **Compliance is enforced on-chain.** Token mint and transfer paths call the compliance contract.
- **Fail closed.** Missing compliance configuration, expired verification or paused state blocks movement.
- **Upgradeability is constrained.** The reference contracts are immutable by default; upgrade strategy requires governance and audit review.

## Known limitations

- Contracts are unaudited in this repository state.
- The API demo adapter is not a production datastore.
- IPFS pinning and key management are integration points, not bundled services.
- The indexer is a reference poller; production requires redundant ingestion, reorg handling and monitoring.
- No formal verification has been performed.

## Dependency and release hygiene

- CI runs TypeScript type checks, unit tests, contract tests and production builds.
- Dependabot is enabled for npm, Cargo and GitHub Actions.
- Contract artifacts must be built from a tagged commit and compared to the deployment manifest.
- Release notes must state whether contracts changed and whether a migration/audit is required.
