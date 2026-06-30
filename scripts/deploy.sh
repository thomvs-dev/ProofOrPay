#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts"

echo "Building reputation_ledger, proof_badge, and stake_pool..."
stellar contract build --manifest-path proof_badge/Cargo.toml
stellar contract build

echo "WASM outputs:"
echo "  reputation_ledger: target/wasm32v1-none/release/reputation_ledger.wasm"
echo "  proof_badge:       target/wasm32v1-none/release/proof_badge.wasm"
echo "  stake_pool:        target/wasm32v1-none/release/stake_pool.wasm"
echo ""
echo "Deploy with stellar contract deploy (see README and docs/RUNBOOK.md)."
