# Sprint 1 — Production Data Foundation (Backlog)

## Objetivo

Backend como fuente de verdad confiable: PostgreSQL, identidad por wallet, autorización, activos, ofertas, API real, pruebas.

## Tareas concretas

### 1. PostgreSQL y migraciones

- Archivos: `infrastructure/database/migrations/0002_identity.sql` (creado), `0003_assets.sql`, `0004_offerings.sql`, etc.
- Funciones: `db-migrate.ts` debe aplicar todas las migraciones en orden.
- Pruebas: migración idempotente, constraints, transacciones atómicas.

### 2. Identidad y sesiones

- Archivos: `services/api/src/repository.ts` (getInvestor(wallet)), `services/api/src/postgres-repository.ts`.
- Nuevo: `services/api/src/auth.ts` (verificación de firma de wallet, sesiones).
- Endpoints: `POST /v1/auth/challenge`, `POST /v1/auth/verify`.
- Pruebas: aislamiento entre wallets, sesión expirada.

### 3. Autorización por roles

- Archivos: `services/api/src/server.ts` (middleware de roles), `packages/shared-types`.
- Roles: Investor, Issuer, Admin, Operations.
- Pruebas: acceso denegado sin rol.

### 4. Activos y ofertas

- Repositorio: createAssetDraft, listAssets, getAsset con datos reales.
- Ofertas: createOffering, subscribe (wallet-first, on-chain verification).
- Pruebas: persistencia tras reinicio, idempotencia.

### 5. API y portales

- Eliminar imports de `demoSnapshot` en portales.
- Usar `createBrowserApi()` con loading/error/empty states.
- Pruebas E2E con datos reales.

### 6. Indexer (Sprint 3 preview)

- `services/indexer` consume Soroban RPC y persiste eventos.
- Reconciliación DB vs contratos.

## Criterio de salida

Un usuario crea un activo, cierra sesión, reinicia la app y el registro persiste, pertenece al usuario correcto y aparece en apps autorizadas. Sin datos demo.
