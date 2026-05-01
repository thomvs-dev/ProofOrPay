"use client";

import { useState } from "react";
import { useWallet } from "./WalletConnect";
import { CONTRACT_IDS, NETWORK } from "@/lib/constants";
import { addressToScVal, buildAndSubmitTx, u64ToScVal } from "@/lib/stellar";
import { TxStatus, type TxState } from "./TxStatus";

export function StakeForm({ poolId, onSuccess }: { poolId: bigint; onSuccess?: () => void }) {
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
      onSuccess?.();
    } catch (e) {
      setTx({ status: "failed", error: e instanceof Error ? e.message : String(e) });
    }
  }

  if (!publicKey) {
    return <p className="text-sm text-nb-muted font-bold uppercase">CONNECT WALLET TO STAKE.</p>;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onStake}
        disabled={tx.status === "pending" || !CONTRACT_IDS.stakePool}
        className="nb-btn-yellow disabled:opacity-50"
      >
        {tx.status === "pending" ? "CONFIRM IN WALLET…" : `STAKE ON POOL #${poolId.toString()} →`}
      </button>
      <p className="text-xs text-nb-muted font-mono">{NETWORK.networkId}</p>
      <TxStatus state={tx} label="STAKE" />
    </div>
  );
}
