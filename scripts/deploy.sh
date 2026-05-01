#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/contracts"

echo "Building stake_pool and reputation_ledger..."
soroban contract build --manifest-path stake_pool/Cargo.toml
soroban contract build --manifest-path reputation_ledger/Cargo.toml

echo "WASM outputs:"
echo "  stake_pool:       target/wasm32-unknown-unknown/release/stake_pool.wasm"
echo "  reputation_ledger: target/wasm32-unknown-unknown/release/reputation_ledger.wasm"
echo ""
echo "Deploy with soroban contract deploy (see docs/PROTOCOL.md and your pact protocol spec)."
