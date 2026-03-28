export const ERRORS = {
  WALLET_NOT_FOUND:
    "No Stellar wallet detected. Install Freighter or xBull to continue.",
  USER_REJECTED: "Transaction cancelled. You can try again.",
  INSUFFICIENT_BALANCE: "Insufficient XLM for this stake.",
  WALLET_NOT_CONNECTED: "Connect a wallet first.",
} as const;

export type WalletErrorCode = keyof typeof ERRORS;
