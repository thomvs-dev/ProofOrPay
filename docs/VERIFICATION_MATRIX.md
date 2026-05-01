# Contract verification matrix (testnet)

Maps every **public** Soroban entrypoint to purpose, auth, expected outcome, and where testnet evidence is recorded.

| Contract | Function | Auth / caller | Expected outcome | Evidence |
|----------|----------|---------------|------------------|----------|
| StakePool | `init` | Deployer (once) | Instance storage wired; pool count 0 | [TESTNET_EVIDENCE.json](TESTNET_EVIDENCE.json) `stake_pool.init` |
| StakePool | `create_pool` | Creator | New pool id; **requires** `stake_amount > 0`, future deadline | Optional tx row or manual runbook entry |
| StakePool | `stake` | Member | XLM transferred to contract; member marked staked | Evidence after funded user flow |
| StakePool | `submit_proof` | Member | `proof_url` set | Evidence after user flow |
| StakePool | `record_ai_verdict` | Verifier address (on-chain) | `ai_score` set | Evidence via backend key or manual |
| StakePool | `confirm_peer` | Confirmer (≠ confirmee) | Peer confirmation count ++ | Evidence two members |
| StakePool | `settle_pool` | Any | After deadline: transfers + `ReputationLedger` outcomes | Evidence post-deadline pool |
| StakePool | `get_pool` | Read | Returns `Pool` or panic | [verify-testnet](../frontend/scripts/verify-testnet.mjs) readonly |
| StakePool | `get_member` | Read | Returns `Member` (default if missing) | verify-testnet |
| StakePool | `get_all_pools` | Read | `Vec<Pool>` | verify-testnet + [metrics API](../frontend/src/app/api/metrics/route.ts) |
| ReputationLedger | `init` | Deployer (once) | Stake pool caller set | [TESTNET_EVIDENCE.json](TESTNET_EVIDENCE.json) `reputation_ledger.init` |
| ReputationLedger | `record_outcome` | StakePool auth only | Wins/slashes/streak updated | Proven **indirectly** when `settle_pool` succeeds (StakePool subcalls) |
| ReputationLedger | `add_stake_stats` | StakePool auth only | Economic aggregates updated | Optional explicit tx if StakePool is extended to call it |
| ReputationLedger | `get_reputation` | Read | `Reputation` struct | verify-testnet |
| ReputationLedger | `get_leaderboard` | Read | `Vec<Reputation>` | verify-testnet |

**Notes**

- `init` on both contracts is **one-time**; repeating fails with `already init`.
- `record_outcome` / `add_stake_stats` cannot be invoked directly with an EOA; evidence for `record_outcome` is the **settlement transaction** where StakePool invokes the ledger.
- Paste new successful tx hashes into [TESTNET_EVIDENCE.json](TESTNET_EVIDENCE.json) and Stellar Expert links.
