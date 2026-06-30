"use client";

import { useState } from "react";
import { useWallet } from "./WalletConnect";
import { CONTRACT_IDS, NETWORK } from "@/lib/constants";
import { addressToScVal, buildAndSubmitTx, u64ToScVal } from "@/lib/stellar";
import { TxStatus, type TxState } from "./TxStatus";
import { NbButton } from "@/components/ui/NbButton";

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
    return <p className="text-sm text-black/55">Connect wallet to stake.</p>;
  }

  return (
    <div className="space-y-3">
      <NbButton
        type="button"
        variant="yellow"
        onClick={onStake}
        loading={tx.status === "pending"}
        disabled={tx.status === "pending" || !CONTRACT_IDS.stakePool}
      >
        {tx.status === "pending" ? "Confirm in wallet…" : `Stake on pool #${poolId.toString()}`}
      </NbButton>
      <p className="text-xs text-black/45 font-mono">{NETWORK.networkId}</p>
      <TxStatus
        state={tx}
        label="Stake"
        onDismiss={() => setTx({ status: "idle" })}
        onRetry={() => setTx({ status: "idle" })}
      />
    </div>
  );
}
