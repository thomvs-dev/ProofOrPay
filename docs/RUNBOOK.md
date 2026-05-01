# Production / testnet runbook

## Prerequisites

- Soroban CLI (for WASM build / optional `invoke`)
- Node 20+, Rust stable
- Testnet XLM (Friendbot or faucet) for user flows

## Deploy & env

1. Build contracts: [`scripts/deploy.sh`](../scripts/deploy.sh).
2. Deploy WASM and run `init` per [README](../README.md) (ReputationLedger first).
3. Frontend: `cp frontend/.env.example frontend/.env.local` — set `NEXT_PUBLIC_STAKE_POOL_ID`, `NEXT_PUBLIC_REPUTATION_LEDGER_ID`, `ANTHROPIC_API_KEY`, `STELLAR_VERIFIER_SECRET_KEY` (verifier matches StakePool init).
4. Optional metrics: `METRICS_SIMULATION_PUBLIC_KEY` (funded testnet account).

## Verification

- **Read-only:** `cd frontend && npm run verify:testnet` → JSON report on stdout; `--write=path.json` supported.
- **Snapshot:** [`scripts/snapshot-pools.sh`](../scripts/snapshot-pools.sh).
- **Health:** `GET /api/health` on the deployed host.

## Write flows (tx evidence)

Paste successful transaction hashes into [`docs/TESTNET_EVIDENCE.json`](TESTNET_EVIDENCE.json) with Stellar Expert links.

| Step | Script / UI |
|------|-------------|
| `create_pool` | [`scripts/invoke-test.sh`](../scripts/invoke-test.sh) or app |
| `stake`, `submit_proof`, `confirm_peer` | App with wallet |
| `record_ai_verdict` | `/api/score` + verifier key |
| `settle_pool` | After deadline via wallet |

## Incident contacts

- Document your on-call channel in your deployment platform; not stored in git.
