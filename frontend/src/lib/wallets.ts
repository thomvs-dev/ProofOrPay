import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from "@creit.tech/stellar-wallets-kit";

export function createWalletKit(): StellarWalletsKit {
  return new StellarWalletsKit({
    network: WalletNetwork.TESTNET,
    modules: allowAllModules(),
    selectedWalletId: FREIGHTER_ID,
  });
}
