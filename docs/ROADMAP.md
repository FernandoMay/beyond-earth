# Roadmap

| Phase | Outcome | State in this repository |
| --- | --- | --- |
| 01 — Foundation | Brand, domain model, architecture, evidence fixtures, ADRs | Implemented |
| 02 — Core protocol | Registry, compliance, token, investment, escrow, revenue, roles | Implemented and unit tested |
| 03 — Marketplace | Issuer onboarding, secondary market, wallet connection, portfolios | Interface and contracts implemented |
| 04 — Operations | Leasing, maintenance, insurance, valuations, oracle verification | Interface, contracts and libraries implemented |
| 05 — Multi-vertical | Aviation, space, manufacturing, drones, cross-vertical listings | Demo structures and protocol coverage |
| 06 — Institutional production | Audits, legal review, custody, monitoring, mainnet, pilot issuer | Not started |

## Deliberate gaps

- Contracts do not yet publish a complete event stream; the indexer library is
  ready but event coverage must be completed and integration tested.
- The wallet integration is Testnet-oriented and demo-guarded.
- No production signer, custody arrangement, legal vehicle or issuer is included.
- The marketplace uses seller allowances rather than custody; production should
  review approval hygiene and revocation.
- Notifications are transport-neutral; no vendor integration is included.

These gaps are documented rather than hidden. A production launch requires the
controls in [DEPLOYMENT.md](DEPLOYMENT.md) and [COMPLIANCE.md](COMPLIANCE.md).
