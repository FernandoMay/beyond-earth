# Operations

The operations portal covers leases, maintenance, insurance, oracle freshness and
the task queue. Each record is illustrative in demo mode.

## Lease lifecycle

1. A lease is created with a rent amount, interval and start time.
2. Rent is paid by the lessee in the settlement asset. A payment advances the next
   due date and cures arrears.
3. The lessor or admin can flag arrears after the due date.
4. An arrears lease can be defaulted; defaulting is an operational record, not an
   automatic seizure of the aircraft, engine or other asset.
5. The lessor or admin can close a lease.

## Maintenance and insurance

Maintenance and insurance records are operational evidence. They do not change
token balances. A missed maintenance event or an expiring policy should create a
task and may suspend an offering after review.

## Oracle verification

`services/oracle-adapters` verifies Ed25519 signatures over a canonical reading,
checks the source allowlist, freshness, future-clock skew and optional value
bands. A rejected reading must not update a valuation or lease state.

## Evidence verification

`services/document-verification` creates and verifies SHA-256 manifests. Run
`npm run demo:hash` to confirm demo digests. Any digest mismatch, missing file,
duplicate name or unexpected file is a review event.

## Indexer recovery

The indexer processes events by ledger, records processed ids and advances a
cursor only after a handler succeeds. On failure:

1. Inspect the failed event and the cursor.
2. Fix the decoder or downstream state.
3. Replay from the last good ledger.
4. Confirm no duplicate financial effect; handlers must be idempotent.

## Notifications

Notifications are rendered from fixed templates, labelled with the environment
and delivered once per idempotency key. A failed transport records nothing so the
same key can be retried.
