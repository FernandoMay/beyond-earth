# Engineering Audit — Beyond Earth (Aerospace RWA)

**Date:** 2026-11-26
**Scope:** Soroban contract workspace, documentation, CI workflows, indexer, API.
**Branch:** `docs/engineering-audit` (no changes to `main`).

## Method

- Inspected `contracts/` (12 crates), `README.md`, `docs/PROTOCOL.md`, `docs/TESTING.md`.
- Ran `cargo fmt --check`, `cargo clippy --all-targets -D warnings`, `cargo test --workspace`, `stellar contract build`.
- Ran `npm run format:check`, `npm run typecheck`, `npm run test:unit`, `npm run build:apps`, `npm run build:services`.
- Grepped for `.publish(`, contract IDs, and service integration references.

## Findings (ranked by engineering value / risk)

### F1 — Contract count documentation drift
- **Files:** `README.md` (line 20), `docs/PROTOCOL.md` (line 3), `contracts/Cargo.toml` (workspace members), `scripts/deploy-contracts.sh`
- **Observed:** README declares 11 contracts; PROTOCOL.md declares 10; workspace contains 12 (`vault`, `withdrawals` added later). Deploy script lists 11 (includes `withdrawals`, not `vault`).
- **Severity:** Low — documentation/integration mismatch.
- **Type:** Documentation.
- **Fix:** Update README and PROTOCOL.md to reflect 12 contracts; add `vault` to deploy script; clarify which contracts are core protocol vs. auxiliary.

### F2 — Governance and withdrawals publish no events
- **Files:** `contracts/governance/src/lib.rs`, `contracts/withdrawals/src/lib.rs`
- **Symbols:** All state-changing functions (`propose`, `vote`, `finalize`, `execute`, `cancel`, `reabrir_propuesta`, `votar_y_finalizar`, `ejecutar_todo`, `cancelar_masivo`, `retirar`, `depositar`, etc.)
- **Observed:** `grep -c "\.publish(&env)"` returns 0 for both. No `contractevent` definitions. The indexer's `ChainEvent` schema has no mapping for governance/withdrawal state changes.
- **Severity:** Medium — indexer cannot observe these state changes.
- **Type:** Implementation.
- **Fix:** Add `#[contractevent]` structs and `.publish()` calls to all state-changing functions in both contracts.

### F3 — `revocar_todo` hides authorization failure
- **File:** `contracts/access-control/src/lib.rs`, function `revocar_todo`
- **Observed:** Returns `0` when caller is not admin instead of an error. Originally panicked; changed to return 0. Still hides auth failure. Also now emits `RoleRevoked` per role (fixed).
- **Severity:** Medium — correctness/authorization clarity.
- **Type:** Implementation.
- **Fix:** Change return type to `Result<u32, Error>` with `Unauthorized` variant; update callers and tests.

### F4 — rwa-token direct balance mutations bypass paused/compliance/events
- **File:** `contracts/rwa-token/src/lib.rs`, functions `transferir_con_fee`, `transferir_todo`, `mintear_recompensa`, `quemar_masivo`
- **Observed:** These functions directly mutate `DataKey::Balance` and `TotalSupply` without checking `is_paused`, `check_compliance`, or emitting `TokenTransferred`/`TokenMinted`/`TokenBurned` events (partially fixed in `transferir_con_fee` and `transferir_todo`).
- **Severity:** High — security/consistency.
- **Type:** Implementation.
- **Fix:** Route all balance mutations through `transfer_internal`/`mint`/`burn` helpers; ensure paused and compliance checks; emit events.

### F5 — `revenue-distribution::cerrar_todo` only closes caller's distributions
- **File:** `contracts/revenue-distribution/src/lib.rs`, function `cerrar_todo`
- **Observed:** Reads `IssuerDistributions(caller)`; admin cannot close all issuers' distributions.
- **Severity:** Low — operational limitation.
- **Type:** Implementation.
- **Fix:** Add an admin path that iterates all distribution IDs (requires a global list).

### F6 — Batch methods lack explicit size limits
- **Files:** `contracts/marketplace/src/lib.rs` (`registrar_compras`, `aplicar_descuento_masivo`, `cancelar_masivo`), `contracts/escrow/src/lib.rs` (`reembolsar_todo`), `contracts/investment/src/lib.rs` (`suscribir_masivo`, `marcar_fallido_masivo`), `contracts/revenue-distribution/src/lib.rs` (`asignar_masivo`, `reclamar_masivo`, `cerrar_todo`), `contracts/withdrawals/src/lib.rs` (`depositar_masivo`), `contracts/access-control/src/lib.rs` (`otorgar_masivo`), `contracts/asset-registry/src/lib.rs` (`verificar_masivo`, `suspender_masivo`), `contracts/compliance/src/lib.rs` (`suspender_masivo`), `contracts/governance/src/lib.rs` (`ejecutar_todo`, `cancelar_masivo`).
- **Observed:** No explicit maximum batch size; resource consumption unbounded.
- **Severity:** Low — DoS/gas risk.
- **Type:** Implementation.
- **Fix:** Add `MAX_BATCH_SIZE` constant and reject larger batches.

### F7 — Withdrawals contract not integrated
- **File:** `contracts/withdrawals/src/lib.rs`
- **Observed:** No references in `apps/`, `services/`, or `packages/`. Only in manifest and tests.
- **Severity:** Medium — orphaned contract.
- **Type:** Integration.
- **Fix:** Either integrate into a service flow or document as auxiliary/test contract.

### F8 — Indexer has no persistent store or Soroban RPC adapter
- **Files:** `services/indexer/src/index.ts`, `services/indexer/src/main.ts`, `services/indexer/src/rpc.ts`
- **Observed:** `IndexerStore` is in-memory only; `main.ts` maps Soroban events crudely to `asset.registered` type for all events; no cursor persistence.
- **Severity:** High — operational gap.
- **Type:** Integration.
- **Fix:** Implement a Postgres-backed `IndexerStore`; add proper event type mapping from Soroban contract events.

### F9 — CI workflow contract build (fixed)
- **File:** `.github/workflows/ci.yml`
- **Observed:** Original `cargo build --target wasm32v1-none` fails because `soroban-sdk` requires stellar-cli. Fixed to use `stellar contract build` with stellar-cli install step.
- **Severity:** Medium — CI red.
- **Type:** CI.
- **Status:** Fixed in commit `99fbc08`.

### F10 — Vault contract not in README/docs
- **File:** `contracts/vault/src/lib.rs`
- **Observed:** Not mentioned in README or PROTOCOL.md; not in deploy script.
- **Severity:** Low — documentation drift.
- **Type:** Documentation.

## Verification commands

```bash
cargo fmt --manifest-path contracts/Cargo.toml --all -- --check
cargo clippy --workspace --manifest-path contracts/Cargo.toml --all-targets -- -D warnings
cargo test --workspace --manifest-path contracts/Cargo.toml
stellar contract build --manifest-path contracts/Cargo.toml
npm run format:check
npm run typecheck
npm run test:unit
npm run build:apps
npm run build:services
```

All pass as of this audit (after fixes).

## Recommended first contribution (one PR)

**Fix `revocar_todo` authorization semantics in `access-control`.**

- **Files:** `contracts/access-control/src/lib.rs` (function `revocar_todo`), `contracts/access-control/src/test.rs`
- **Change:** Convert return type from `u32` to `Result<u32, Error>`; return `Err(Error::Unauthorized)` when caller is not admin instead of `0` or panic. Update tests accordingly.
- **Why:** Smallest, highest-value correctness fix. Authorization failures must not be indistinguishable from no-op successes. Low implementation risk, clear tests.
- **Tests:** Add test that non-admin calling `revocar_todo` receives `Unauthorized`; verify admin still succeeds.

This is an **implementation** fix, not documentation-only.
