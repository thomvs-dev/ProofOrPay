"use client";

import { useState } from "react";
import { useWallet } from "./WalletConnect";
import { CONTRACT_IDS, NETWORK } from "@/lib/constants";
import { addressToScVal, buildAndSubmitTx, u64ToScVal } from "@/lib/stellar";
import { TxStatus, type TxState } from "./TxStatus";

export function StakeForm({ poolId }: { poolId: bigint }) {
  const { publicKey, signTransaction } = useWallet();
  const [tx, setTx] = useState<TxState>({ status: "idle" });

  async function onStake() {
    if (!publicKey || !CONTRACT_IDS.stakePool) return;
    setTx({ status: "pending" });
    try {
      const hash = await buildAndSubmitTx(
        CONTRACT_IDS.stakePool,
        "stake",
        [u64ToScVal(poolId), addressToScVal(publicKey)],
        publicKey,
        signTransaction,
      );
      setTx({ status: "success", hash });
    } catch (e) {
      setTx({
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  if (!publicKey) {
    return (
      <p className="text-sm text-gray-500">Connect a wallet to stake.</p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onStake}
        disabled={tx.status === "pending" || !CONTRACT_IDS.stakePool}
        className="px-4 py-2 rounded-lg bg-stellar-blue text-white text-sm font-medium disabled:opacity-50"
      >
        Stake on pool #{poolId.toString()}
      </button>
      <TxStatus state={tx} label={`Stake (${NETWORK.networkId})`} />
    </div>
  );
}
