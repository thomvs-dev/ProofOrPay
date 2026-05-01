# ProofOrPay protocol (in-repo summary)

Full prose may live in a separate `pact_protocol_spec.md` (often one directory above this repo in a monorepo). This project implements:

1. **StakePool** — Accountability pools: stake XLM (SAC), submit proof URL, AI score from a designated **verifier** address, peer confirmations, settlement, and optional bonus/slash economics.
2. **ReputationLedger** — Aggregated wins/slashes and leaderboard; updated when pools **settle** (StakePool invokes `record_outcome`).

**Advanced feature (app):** Off-chain Claude scoring plus on-chain `record_ai_verdict` ([`/api/score`](../frontend/src/app/api/score/route.ts)).

**Deploy order:** deploy & `init` ReputationLedger → deploy & `init` StakePool with XLM SAC, reputation contract ID, and verifier `G…` derived from `STELLAR_VERIFIER_SECRET_KEY`.
