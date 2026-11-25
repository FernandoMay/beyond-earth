# Contributing to Aerospace RWA

Thank you for helping build financial infrastructure for the aerospace economy.

## Before you start

- Read `README.md`, `docs/ARCHITECTURE.md`, `docs/PROTOCOL.md`, `SECURITY.md` and the relevant ADRs.
- This project handles regulated financial concepts. Do not introduce claims of legal ownership, guaranteed returns or real transaction records without legal and compliance review.
- Never commit secret keys, mnemonics, customer data, private documents or production credentials.

## Development setup

```bash
npm install
npm run typecheck
npm run test:unit
npm run test:contracts
npm run build
```

Requirements: Node.js 22+, npm 11+, Rust 1.85+, Stellar CLI 23+.

## Workflow

1. Open an issue describing the change and its risk class.
2. Create a branch: `feat/<area>-<short-description>` or `fix/<area>-<short-description>`.
3. Keep commits focused and use conventional prefixes (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
4. Add or update tests. Contract changes require invariant tests and an ADR if storage or external interfaces change.
5. Run the full local checks.
6. Open a pull request using the template. Describe security, compliance and migration impact.

## Code standards

- TypeScript: strict mode, no `any` without documented justification, prefer explicit domain types.
- React: server components by default; client components only for interaction.
- CSS: use design tokens from `@aerospace/design-system`; no one-off colour systems.
- Rust: `cargo fmt`, `cargo clippy -D warnings`, checked arithmetic and explicit authorisation.
- API: Zod validation at the boundary; no business rules only in the UI.
- Data: every demo row must be labelled `demo` and must not mimic a real confirmed transaction.
- All user-facing monetary values must state the asset/currency and whether they are illustrative.

## Contract change requirements

Any change to a Soroban contract must include:

- Unit tests, including failure paths and authorisation tests.
- Storage migration or explicit breaking-change note.
- Event schema update.
- Threat-model review if the trust boundary changes.
- Updated `docs/PROTOCOL.md` and deployment manifest guidance.

## Security disclosures

Do not open public issues for vulnerabilities. Follow `SECURITY.md`.

## License

Contributions are accepted under the Apache License 2.0.
