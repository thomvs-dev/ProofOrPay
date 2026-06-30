"use client";

import { useState } from "react";
import { useWallet } from "./WalletConnect";
import { CONTRACT_IDS } from "@/lib/constants";
import { addressToScVal, buildAndSubmitTx, stringToScVal, u64ToScVal } from "@/lib/stellar";
import { TxStatus, type TxState } from "./TxStatus";
import { IpfsUploadField } from "@/components/IpfsUploadField";
import { ProofBadgeCard } from "@/components/ProofBadgeCard";
import type { ProofBadgeView } from "@/types/pact";

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
  const [proofCid, setProofCid] = useState("");
  const [imageCid, setImageCid] = useState("");
  const [tx, setTx] = useState<TxState>({ status: "idle" });
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [scoreResult, setScoreResult] = useState<{
    score: number;
    breakdown?: Record<string, unknown>;
    onchainTx?: string | null;
  } | null>(null);
  const [previewBadge, setPreviewBadge] = useState<ProofBadgeView | null>(null);

  async function submitProof() {
    if (!publicKey || !CONTRACT_IDS.stakePool || !url.trim()) return;
    setTx({ status: "pending" });
    setScoreResult(null);
    setScoreError(null);
    setPreviewBadge(null);

    let txHash: string;
    try {
      txHash = await buildAndSubmitTx(
        CONTRACT_IDS.stakePool,
        "submit_proof",
        [
          u64ToScVal(poolId),
          addressToScVal(publicKey),
          stringToScVal(url.trim()),
          stringToScVal(proofCid.trim()),
          stringToScVal(imageCid.trim()),
        ],
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
        body: JSON.stringify({
          pool_id: poolId.toString(),
          member_address: publicKey,
          proof_url: url.trim(),
          goal,
          proof_cid: proofCid.trim() || undefined,
          image_cid: imageCid.trim() || undefined,
        }),
      });
      const data = await res.json() as {
        score?: number;
        breakdown?: Record<string, unknown>;
        onchainTx?: string | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "score failed");
      const score = data.score ?? 0;
      setScoreResult({ score, breakdown: data.breakdown, onchainTx: data.onchainTx ?? null });
      setPreviewBadge({
        token_id: 0n,
        pool_id: poolId,
        owner: publicKey,
        proof_url: url.trim(),
        proof_cid: proofCid.trim(),
        image_cid: imageCid.trim(),
        ai_score: score,
        goal,
        minted_at: BigInt(Math.floor(Date.now() / 1000)),
      });
      onSuccess?.();
    } catch (e) {
      setScoreError(e instanceof Error ? e.message : String(e));
    } finally {
      setScoreLoading(false);
    }
  }

  if (!publicKey) {
    return <p className="text-sm text-black/55">Connect wallet to submit.</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="nb-label">Proof URL (repo / demo / doc)</label>
        <input
          className="nb-input font-mono"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/…"
        />
      </div>

      <IpfsUploadField
        label="Proof screenshot (IPFS)"
        cid={imageCid}
        onCidChange={setImageCid}
        hint="Becomes the NFT artwork when you ship and the pool settles."
      />

      <IpfsUploadField
        label="Proof metadata CID (optional)"
        cid={proofCid}
        onCidChange={setProofCid}
        accept="application/json,.json"
        hint="Optional JSON metadata CID for rich proof details."
      />

      <button
        type="button"
        onClick={submitProof}
        disabled={tx.status === "pending" || scoreLoading || !url.trim()}
        className="nb-btn-yellow disabled:opacity-50"
      >
        {scoreLoading ? "AI scoring…" : "Submit proof & get AI score"}
      </button>
      <TxStatus state={tx} label="Submit proof" />
      {scoreError && (
        <div className="nb-card p-3 border-red-200 bg-red-50">
          <p className="text-red-800 text-xs font-medium">AI score failed</p>
          <p className="text-red-700/80 text-xs mt-1">{scoreError}</p>
        </div>
      )}
      {scoreLoading && (
        <div className="flex items-center gap-2 text-black/55 text-xs">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-black/20 border-t-black" />
          AI judge scoring in progress…
        </div>
      )}
      {scoreResult && (
        <div className="space-y-4">
          <div className="nb-card p-3 border-emerald-200 bg-emerald-50">
            <p className="text-emerald-800 font-medium text-lg">Score: {scoreResult.score}</p>
            {scoreResult.onchainTx && (
              <a
                className="text-black text-xs underline mt-2 inline-block"
                href={`https://stellar.expert/explorer/testnet/tx/${scoreResult.onchainTx}`}
                target="_blank"
                rel="noreferrer"
              >
                View verdict tx
              </a>
            )}
          </div>
          {previewBadge && (
            <div>
              <p className="text-xs text-black/45 mb-3">
                Proof badge preview (minted on settle)
              </p>
              <ProofBadgeCard badge={previewBadge} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
