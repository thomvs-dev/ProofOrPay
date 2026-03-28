export const NETWORK = {
  rpcUrl: "https://soroban-testnet.stellar.org",
  horizonUrl: "https://horizon-testnet.stellar.org",
  passphrase: "Test SDF Network ; September 2015",
  networkId: "TESTNET",
} as const;

export const CONTRACT_IDS = {
  stakePool: process.env.NEXT_PUBLIC_STAKE_POOL_ID ?? "",
  reputationLedger: process.env.NEXT_PUBLIC_REPUTATION_LEDGER_ID ?? "",
  xlmToken:
    process.env.NEXT_PUBLIC_XLM_TOKEN_ID ??
    "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
} as const;

export const BASE_FEE = "100";
export const TX_TIMEOUT_SEC = 30;
