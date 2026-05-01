#!/usr/bin/env bash
# Writes latest verification JSON under docs/reports/ (requires npm deps in frontend).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${OUT:-$ROOT/docs/reports/testnet-verify-latest.json}"
mkdir -p "$(dirname "$OUT")"
cd "$ROOT/frontend"
npm ci --silent 2>/dev/null || npm ci
node scripts/verify-testnet.mjs --write="$OUT"
echo "Snapshot written to $OUT"
