# Monitoring

| Check | Endpoint / path | Notes |
|-------|-----------------|-------|
| **App liveness** | `GET /api/health` | Returns JSON including `soroban_rpc_reachable` (HEAD against Soroban RPC). |
| **On-chain read path** | `GET /api/metrics` | Requires `METRICS_SIMULATION_PUBLIC_KEY` + contract env vars. |
| **CI** | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) | Contract `cargo test` + `next build` on push/PR. |
| **Periodic testnet** | [`.github/workflows/testnet-verify.yml`](../.github/workflows/testnet-verify.yml) | Weekly + manual `npm run verify:testnet`. |

**Recommended production additions**

- Uptime checks against your deployed URL for `/api/health` (expect `200`, `soroban_rpc_reachable: true`).
- Optional: forward server errors to Sentry/OTel (not embedded in repo; plug in at host).
