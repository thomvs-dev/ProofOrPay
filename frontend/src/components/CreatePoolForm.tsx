"use client";

import { useState } from "react";
import { useWallet } from "./WalletConnect";
import { CONTRACT_IDS } from "@/lib/constants";
import {
  addressToScVal,
  buildAndSubmitTx,
  i128ToScVal,
  stringToScVal,
  u32ToScVal,
  u64ToScVal,
  xlmToStroops,
} from "@/lib/stellar";
import { TxStatus, type TxState } from "./TxStatus";

type Props = { onPoolCreated?: () => void };

export function CreatePoolForm({ onPoolCreated }: Props) {
  const { publicKey, signTransaction } = useWallet();
  const [goal, setGoal] = useState("");
  const [days, setDays] = useState(7);
  const [stakeXlm, setStakeXlm] = useState(1);
  const [threshold, setThreshold] = useState(60);
  const [tx, setTx] = useState<TxState>({ status: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!publicKey || !CONTRACT_IDS.stakePool || !goal.trim()) return;
    const deadlineSec = BigInt(Math.floor(Date.now() / 1000) + Math.max(1, days) * 86_400);
    const stroops = xlmToStroops(stakeXlm);
    if (stroops <= 0n) {
      setTx({ status: "failed", error: "Stake amount must be greater than 0." });
      return;
    }
    setTx({ status: "pending" });
    try {
      const hash = await buildAndSubmitTx(
        CONTRACT_IDS.stakePool,
        "create_pool",
        [
          addressToScVal(publicKey),
          stringToScVal(goal.trim()),
          u64ToScVal(deadlineSec),
          i128ToScVal(stroops),
          u32ToScVal(Math.min(100, Math.max(0, Math.floor(threshold)))),
        ],
        publicKey,
        signTransaction,
      );
      setTx({ status: "success", hash });
      setGoal("");
      onPoolCreated?.();
    } catch (err) {
      setTx({ status: "failed", error: err instanceof Error ? err.message : String(err) });
    }
  }

  if (!publicKey) {
    return <p className="text-sm text-nb-muted font-bold uppercase">CONNECT WALLET FIRST.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="nb-label">WHAT ARE YOU SHIPPING?</label>
        <textarea
          required
          rows={3}
          className="nb-input resize-none"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Ship the onboarding flow and deploy to testnet"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="nb-label">DAYS UNTIL DEADLINE</label>
          <input
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(e) => setDays(Number(e.target.value) || 1)}
            className="nb-input"
          />
        </div>
        <div>
          <label className="nb-label">STAKE / MEMBER (XLM)</label>
          <input
            type="number"
            min={0.0000001}
            step={0.1}
            value={stakeXlm}
            onChange={(e) => setStakeXlm(Number(e.target.value))}
            className="nb-input"
          />
        </div>
        <div>
          <label className="nb-label">AI SCORE THRESHOLD (0–100)</label>
          <input
            type="number"
            min={0}
            max={100}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="nb-input"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={tx.status === "pending" || !CONTRACT_IDS.stakePool}
        className="nb-btn-yellow disabled:opacity-50"
      >
        {tx.status === "pending" ? "CONFIRM IN WALLET…" : "CREATE POOL ON-CHAIN →"}
      </button>

      <TxStatus state={tx} label="CREATE POOL" />
    </form>
  );
}
