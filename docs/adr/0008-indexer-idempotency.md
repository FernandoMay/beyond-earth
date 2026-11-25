# 0008. Idempotent, ordered indexer processing

- Status: Accepted
- Date: 2026-02-05

## Context

Soroban event delivery can repeat, arrive out of order or fail mid-batch. A
duplicate subscription or distribution claim would be a financial defect.

## Decision

The indexer sorts events by ledger, serializes batches, records processed event
ids and advances a cursor only after a handler succeeds. A failure stops the
batch at that event so it can be retried without skipping work.

## Consequences

- Handlers must be idempotent and keyed by event id.
- Operators can replay from a known-good ledger.
- The cursor is a recovery aid, not the only duplicate defence.
