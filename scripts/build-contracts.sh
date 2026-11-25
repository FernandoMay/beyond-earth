#!/usr/bin/env bash
# Builds every Soroban contract to WebAssembly and prints the artifact paths.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MANIFEST="$ROOT/contracts/Cargo.toml"
OUT_DIR="$ROOT/contracts/target/wasm32v1-none/release"

if ! command -v stellar >/dev/null 2>&1; then
  echo "stellar CLI is required (https://developers.stellar.org/docs/tools/developer-tools/cli/stellar-cli)." >&2
  exit 1
fi

echo "[contracts:build] building workspace"
cargo build --workspace --release --target wasm32v1-none --manifest-path "$MANIFEST"

echo "[contracts:build] artifacts:"
find "$OUT_DIR" -maxdepth 1 -name '*.wasm' -print | sort
