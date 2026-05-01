"use client";

import { useState } from "react";
import { useWallet } from "./WalletConnect";
import { CONTRACT_IDS } from "@/lib/constants";
import { buildAndSubmitTx, u64ToScVal } from "@/lib/stellar";
import { TxStatus, type TxState } from "./TxStatus";

export function SettlePoolButton({
  poolId,
  deadlineSec,
  nowSec,
  status,
  onSuccess,
}: {
  poolId: bigint;
  deadlineSec: bigint;
  nowSec: number;
  status: string;
  onSuccess?: () => void;
}) {
  const { publicKey, signTransaction } = useWallet();
  const [tx, setTx] = useState<TxState>({ status: "idle" });

  const ended = Number(deadlineSec) <= nowSec;
  const canSettle = status === "Active" && ended;

  async function onSettle() {
    if (!publicKey || !CONTRACT_IDS.stakePool) return;
    setTx({ status: "pending" });
    try {
      const hash = await buildAndSubmitTx(
        CONTRACT_IDS.stakePool,
        "settle_pool",
        [u64ToScVal(poolId)],
        publicKey,
        signTransaction,
      );
      setTx({ status: "success", hash });
      onSuccess?.();
    } catch (e) {
      setTx({ status: "failed", error: e instanceof Error ? e.message : String(e) });
    }
  }

  if (!publicKey) return null;

  if (!canSettle) {
    return (
      <p className="text-xs text-nb-muted font-bold uppercase">
        {!ended
          ? "SETTLEMENT UNLOCKS AFTER DEADLINE."
          : status !== "Active"
          ? "POOL ALREADY SETTLED."
          : null}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border-3 border-nb-orange p-3" style={{ boxShadow: "3px 3px 0 #FF6B35" }}>
        <p className="text-nb-orange font-black uppercase text-sm">⚡ DEADLINE PASSED</p>
        <p className="text-nb-muted text-xs mt-1">
          Anyone can settle. Winners get paid, reputation updates.
        </p>
      </div>
      <button
        type="button"
        onClick={onSettle}
        disabled={tx.status === "pending"}
        className="nb-btn-orange disabled:opacity-50"
      >
        {tx.status === "pending" ? "CONFIRM IN WALLET…" : "SETTLE POOL →"}
      </button>
      <TxStatus state={tx} label="SETTLE" />
    </div>
  );
}
