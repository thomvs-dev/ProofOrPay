"use client";

import { useState } from "react";
import { useWallet } from "./WalletConnect";
import { CONTRACT_IDS } from "@/lib/constants";
import { addressToScVal, buildAndSubmitTx, stringToScVal, u64ToScVal } from "@/lib/stellar";
import { TxStatus, type TxState } from "./TxStatus";

export function SubmissionForm({
  poolId,
  goal,
  onSuccess,
}: {
  poolId: bigint;
  goal: string;
  onSuccess?: () => void;
}) {
  const { publicKey, signTransaction } = useWallet();
  const [url, setUrl] = useState("");
  const [tx, setTx] = useState<TxState>({ status: "idle" });
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<{
    score: number;
    breakdown?: Record<string, unknown>;
    onchainTx?: string | null;
  } | null>(null);

  async function submitProof() {
    if (!publicKey || !CONTRACT_IDS.stakePool || !url.trim()) return;
    setTx({ status: "pending" });
    setScoreResult(null);
    setScoreError(null);

    let txHash: string;
    try {
      txHash = await buildAndSubmitTx(
        CONTRACT_IDS.stakePool,
        "submit_proof",
        [u64ToScVal(poolId), addressToScVal(publicKey), stringToScVal(url.trim())],
        publicKey,
        signTransaction,
      );
    } catch (e) {
      setTx({ status: "failed", error: e instanceof Error ? e.message : String(e) });
      return;
    }

    setTx({ status: "success", hash: txHash });
    setScoreLoading(true);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pool_id: poolId.toString(), member_address: publicKey, proof_url: url.trim(), goal }),
      });
      const data = await res.json() as {
        score?: number;
        breakdown?: Record<string, unknown>;
        onchainTx?: string | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "score failed");
      setScoreResult({ score: data.score ?? 0, breakdown: data.breakdown, onchainTx: data.onchainTx ?? null });
      onSuccess?.();
    } catch (e) {
      setScoreError(e instanceof Error ? e.message : String(e));
    } finally {
      setScoreLoading(false);
    }
  }

  if (!publicKey) {
    return <p className="text-sm text-nb-muted font-bold uppercase">CONNECT WALLET TO SUBMIT.</p>;
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="nb-label">PROOF URL (REPO / DEMO / DOC)</label>
        <input
          className="nb-input font-mono"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/…"
        />
      </div>
      <button
        type="button"
        onClick={submitProof}
        disabled={tx.status === "pending" || scoreLoading || !url.trim()}
        className="nb-btn-pink disabled:opacity-50"
      >
        {scoreLoading ? "AI SCORING…" : "SUBMIT PROOF & GET AI SCORE →"}
      </button>
      <TxStatus state={tx} label="SUBMIT PROOF" />
      {scoreError && (
        <div className="border-3 border-nb-orange p-3" style={{ boxShadow: "3px 3px 0 #FF6B35" }}>
          <p className="text-nb-orange font-black uppercase text-xs">AI SCORE FAILED</p>
          <p className="text-nb-muted text-xs mt-1 normal-case">{scoreError}</p>
        </div>
      )}
      {scoreLoading && (
        <div className="flex items-center gap-2 text-nb-yellow text-xs font-bold uppercase">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-nb-yellow border-t-transparent" />
          AI JUDGE SCORING IN PROGRESS…
        </div>
      )}
      {scoreResult && (
        <div className="border-3 border-nb-green p-3" style={{ boxShadow: "3px 3px 0 #00FF94" }}>
          <p className="text-nb-green font-black uppercase text-lg">SCORE: {scoreResult.score}</p>
          {scoreResult.breakdown && (
            <pre className="mt-2 text-xs text-nb-muted overflow-x-auto font-mono">
              {JSON.stringify(scoreResult.breakdown, null, 2)}
            </pre>
          )}
          {scoreResult.onchainTx && (
            <a
              className="text-nb-yellow text-xs underline font-bold mt-2 inline-block"
              href={`https://stellar.expert/explorer/testnet/tx/${scoreResult.onchainTx}`}
              target="_blank"
              rel="noreferrer"
            >
              VIEW VERDICT TX →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
