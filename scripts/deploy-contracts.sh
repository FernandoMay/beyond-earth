#!/usr/bin/env bash
# Deploys the Aerospace RWA contracts to a configured Stellar network and writes
# a deployment manifest. Nothing is deployed automatically from this repository.
#
# Required:
#   STELLAR_NETWORK=testnet|mainnet
#   STELLAR_SOURCE=<identity or secret key name configured in the Stellar CLI>
#   STELLAR_ALLOW_MAINNET=true when STELLAR_NETWORK=mainnet
#
# The script refuses to run against mainnet unless explicitly allowed.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE="${STELLAR_SOURCE:-}"
MANIFEST_PATH="${MANIFEST_PATH:-$ROOT/infrastructure/deployment/deployments.$NETWORK.json}"
WASM_DIR="$ROOT/contracts/target/wasm32v1-none/release"

if [[ -z "$SOURCE" ]]; then
  echo "STELLAR_SOURCE is required." >&2
  exit 1
fi

if [[ "$NETWORK" == "mainnet" && "${STELLAR_ALLOW_MAINNET:-false}" != "true" ]]; then
  echo "Refusing mainnet deployment without STELLAR_ALLOW_MAINNET=true." >&2
  exit 1
fi

if [[ ! -d "$WASM_DIR" ]]; then
  echo "No WASM artifacts at $WASM_DIR. Run npm run contracts:build first." >&2
  exit 1
fi

contracts=(
  access-control
  asset-registry
  compliance
  rwa-token
  investment
  escrow
  revenue-distribution
  leasing
  marketplace
  governance
)

echo "{\"network\":\"$NETWORK\",\"deployedAt\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"contracts\":{}}" > "$MANIFEST_PATH"

for name in "${contracts[@]}"; do
  wasm="$WASM_DIR/aerospace_${name//-/_}.wasm"
  if [[ ! -f "$wasm" ]]; then
    echo "Missing artifact: $wasm" >&2
    exit 1
  fi
  echo "[deploy] $name"
  id=$(stellar contract deploy \
    --wasm "$wasm" \
    --source "$SOURCE" \
    --network "$NETWORK")
  node -e '
    const fs = require("fs");
    const [path, name, id] = process.argv.slice(1);
    const manifest = JSON.parse(fs.readFileSync(path, "utf8"));
    manifest.contracts[name] = id;
    fs.writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n");
  ' "$MANIFEST_PATH" "$name" "$id"
done

echo "[deploy] manifest written to $MANIFEST_PATH"
echo "[deploy] Commit the manifest only after reviewing every address and network."
