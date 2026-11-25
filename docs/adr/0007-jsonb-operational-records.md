# 0007. JSONB payloads with indexed operational columns

- Status: Accepted
- Date: 2026-02-03

## Context

The domain model evolves quickly while operational queries are stable: filter
assets by vertical and status, list compliance cases, order tasks by due date.
Normalizing every domain field would slow delivery without improving integrity.

## Decision

Store the authoritative domain record as a JSONB payload, alongside indexed
columns for the fields used in queries and constraints. Sections that are not
independently queried are stored in `platform_sections`.

## Consequences

- Schema changes to payload fields do not require a migration.
- Query columns must be kept in sync with the payload by the repository.
- JSONB is not a substitute for validation; the API validates with Zod before
  writes.
