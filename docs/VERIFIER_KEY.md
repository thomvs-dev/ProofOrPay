# Stellar verifier key (`STELLAR_VERIFIER_SECRET_KEY`)

## What it is

When **StakePool** was deployed and `init` ran, one argument was **`verifier`**: a Stellar **account address** (`G…`). Only that account may sign **`record_ai_verdict`** on-chain (the AI score you compute in `/api/score`).

- **`STELLAR_VERIFIER_SECRET_KEY`** is the **secret key** (`S…`) for that **same** `G…` account.
- The Next.js server uses it to sign `record_ai_verdict` so the contract accepts the transaction.

If the secret does not match the `verifier` address stored in the contract, simulation/signing will fail and **onchainTx** will be null (you may still see a score in the UI).

## How to generate a new keypair

From the repo:

```bash
cd frontend && npm run keypair
```

This prints:

1. **`VERIFIER_PUBLIC`** — the `G…` you must pass as `verifier` when deploying **`StakePool::init`** (or use this key if you redeploy).
2. **`STELLAR_VERIFIER_SECRET_KEY`** — put this **only** in `.env.local` (never commit).

Alternatively, any Stellar tool can create a keypair; the rule is the same: **on-chain verifier address must equal** `Keypair.fromSecret(S...).publicKey()`.

## Already deployed testnet contract?

Check which **`verifier`** was set at init (deployment notes or Stellar Expert contract read). You must possess the **`S…`** for **that** `G…`, or **`record_ai_verdict`** cannot be signed for this deployment.

## Related

- [README](../README.md) deploy order and env vars
- [RUNBOOK](RUNBOOK.md)
