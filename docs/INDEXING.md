# Data indexing

This app reads **live Soroban contract state** over the Stellar RPC (simulation + user transactions). There is no separate indexer service in-repo; “indexing” is implemented as:

| Layer | Mechanism |
|-------|-----------|
| **UI** | `get_all_pools` / `get_member` via `@stellar/stellar-sdk` simulation ([`frontend/src/lib/stellar.ts`](../frontend/src/lib/stellar.ts), [`frontend/src/app/page.tsx`](../frontend/src/app/page.tsx)). |
| **Metrics** | `/api/metrics` aggregates pools + leaderboard ([`frontend/src/app/api/metrics/route.ts`](../frontend/src/app/api/metrics/route.ts)). |
| **Snapshots** | [`scripts/snapshot-pools.sh`](../scripts/snapshot-pools.sh) writes JSON via [`frontend/scripts/verify-testnet.mjs`](../frontend/scripts/verify-testnet.mjs) for audits. |

For a full-chain **append-only indexer**, add an external worker (e.g. cron + Soroban RPC `getLedgerEntries` / event ingestion, or a managed indexer when available for your network version). Document the chosen stack in this file when deployed.
