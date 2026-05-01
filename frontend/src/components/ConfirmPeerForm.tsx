"use client";

import { useState } from "react";
import { useWallet } from "./WalletConnect";
import { CONTRACT_IDS } from "@/lib/constants";
import { addressToScVal, buildAndSubmitTx, u64ToScVal } from "@/lib/stellar";
import { TxStatus, type TxState } from "./TxStatus";

export function ConfirmPeerForm({
  poolId,
  memberAddresses,
  onSuccess,
}: {
  poolId: bigint;
  memberAddresses: string[];
  onSuccess?: () => void;
}) {
  const { publicKey, signTransaction } = useWallet();
  const [confirmee, setConfirmee] = useState("");
  const [tx, setTx] = useState<TxState>({ status: "idle" });

  const others = memberAddresses.filter((a) => a && a !== publicKey);

  async function onConfirm() {
    if (!publicKey || !CONTRACT_IDS.stakePool || !confirmee || confirmee === publicKey) return;
    setTx({ status: "pending" });
    try {
      const hash = await buildAndSubmitTx(
        CONTRACT_IDS.stakePool,
        "confirm_peer",
        [u64ToScVal(poolId), addressToScVal(publicKey), addressToScVal(confirmee)],
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
  if (!memberAddresses.includes(publicKey)) {
    return <p className="text-sm text-nb-muted font-bold uppercase">STAKE FIRST TO VOUCH.</p>;
  }
  if (others.length === 0) {
    return <p className="text-sm text-nb-muted font-bold uppercase">NEED OTHER MEMBERS TO VOUCH.</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="nb-label">CONFIRM A MEMBER SHIPPED</label>
        <select
          className="nb-input cursor-pointer"
          value={confirmee}
          onChange={(e) => setConfirmee(e.target.value)}
        >
          <option value="">CHOOSE MEMBER…</option>
          {others.map((a) => (
            <option key={a} value={a}>
              {a.slice(0, 8)}…{a.slice(-4)}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onConfirm}
        disabled={!confirmee || tx.status === "pending"}
        className="nb-btn-blue disabled:opacity-50"
      >
        {tx.status === "pending" ? "CONFIRM IN WALLET…" : "VOUCH FOR PEER →"}
      </button>
      <TxStatus state={tx} label="PEER VOUCH" />
    </div>
  );
}
