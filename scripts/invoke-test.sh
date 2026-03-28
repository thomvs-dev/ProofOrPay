#!/usr/bin/env bash
set -euo pipefail
# Example create_pool invocation. Set environment variables first.
#   export STAKE_POOL_ID=<deployed contract C...>
#   export SOURCE_SECRET=S...
#   export CREATOR_ADDRESS=G...   # usually the same account as SOURCE
: "${STAKE_POOL_ID:?Set STAKE_POOL_ID}"
: "${SOURCE_SECRET:?Set SOURCE_SECRET}"
: "${CREATOR_ADDRESS:?Set CREATOR_ADDRESS}"

RPC="${SOROBAN_RPC_URL:-https://soroban-testnet.stellar.org}"
PASSPHRASE="${STELLAR_NETWORK_PASSPHRASE:-Test SDF Network ; September 2015}"

soroban contract invoke \
  --id "$STAKE_POOL_ID" \
  --source "$SOURCE_SECRET" \
  --rpc-url "$RPC" \
  --network-passphrase "$PASSPHRASE" \
  -- create_pool \
  --creator "$CREATOR_ADDRESS" \
  --goal "Ship a working Soroban dApp" \
  --deadline "$(($(date +%s) + 86400))" \
  --stake_amount 10000000 \
  --threshold 60
