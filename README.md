ProofOrPay

**Tagline:** *Stake your word. Ship or lose.*
🔵 Level 5 - Blue Belt Submission

Please Try the DApp and let me know https://forms.gle/xaYrz9pPpga4Gvpr8
## User Feedback Form Responses 
https://docs.google.com/spreadsheets/d/1KhlwRZR5CFgg0mgbiugZdNBsWBBLp1huaQeiJMlVY-Y/edit?usp=sharing
Stellar Soroban implementation of the [ProofOrPay](../pact_protocol_spec.md): accountability stake pools, AI-assisted proof scoring, and optional reputation ledger.

## Layout

| Path | Purpose |
|------|---------|
| `contracts/reputation_ledger` | `ReputationLedger` — wins / slashes / leaderboard |
| `contracts/stake_pool` | `StakePool` — pools, stakes, proofs, settlement, calls reputation |
| `frontend/` | Next.js 14 — wallets, pools UI, `/api/score` (Claude + on-chain verdict) |
| `scripts/` | Deploy / invoke helpers |

## Contracts

```bash
cd contracts
cargo test --manifest-path stake_pool/Cargo.toml
```

Build WASM (with [Soroban CLI](https://developers.stellar.org/docs/tools/developer-tools)):

```bash
soroban contract build --manifest-path contracts/stake_pool/Cargo.toml
soroban contract build --manifest-path contracts/reputation_ledger/Cargo.toml
```

Deploy order: **ReputationLedger** first (pass its ID into `StakePool::init`), then **StakePool** with XLM SAC, reputation ID, and **verifier** address (the account that will invoke `record_ai_verdict` — typically your backend / `STELLAR_VERIFIER_SECRET_KEY`).

## Frontend

```bash
cd frontend
cp .env.example .env.local   # fill contract IDs + keys
npm install && npm run dev
```

| Env | Role |
|-----|------|
| `NEXT_PUBLIC_STAKE_POOL_ID` | Deployed StakePool contract |
| `NEXT_PUBLIC_REPUTATION_LEDGER_ID` | Optional UI reads |
| `NEXT_PUBLIC_XLM_TOKEN_ID` | Testnet XLM SAC (default in `constants.ts`) |
| `ANTHROPIC_API_KEY` | Claude scoring (`/api/score`) |
| `STELLAR_VERIFIER_SECRET_KEY` | Signs `record_ai_verdict` (must match on-chain verifier) |

## Deployed contracts (testnet)

| Contract | Address |
|----------|---------|
| StakePool | `CCTG6HGQJFCOVK6VVU4SA46KIHQU5Q6QMSJ3WVOXHGZRYXOMANVWTLLW` |
| ReputationLedger | `CBANPWSJ4BDAK46WC3VVB6RRV4TUHCXLWALHYOUGTNBZA3J25SKA7DCE` |

**Init txs:** [Reputation `init`](https://stellar.expert/explorer/testnet/tx/b1c5212f5a51669eed39df79726784c69ab8f32dc6e228898c54a8a4f9443d0c) · [StakePool `init`](https://stellar.expert/explorer/testnet/tx/40f1714670698e0dd8f9993db2702b20a929da4c1581624494af2902f2cf8ec1)

CLI aliases: `proof-or-pay-reputation`, `proof-or-pay-stake-pool` (`stellar contract alias ls`).

## Error handling (UI)

| Situation | UX |
|-----------|-----|
| No wallet | Banner + Freighter / xBull links |
| User rejects tx | Message per `ERRORS.USER_REJECTED` |
| Low balance | `BalanceHint` + testnet funding docs link |

## CI

GitHub Actions runs contract tests and `next build` (see `.github/workflows/ci.yml`).
