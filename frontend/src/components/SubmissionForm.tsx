"use client";

import { useState } from "react";
import { useWallet } from "./WalletConnect";
import { CONTRACT_IDS } from "@/lib/constants";
import { addressToScVal, buildAndSubmitTx, stringToScVal, u64ToScVal } from "@/lib/stellar";
import { TxStatus, type TxState } from "./TxStatus";

export function SubmissionForm({
  poolId,
  goal,
}: {
  poolId: bigint;
  goal: string;
}) {
  const { publicKey, signTransaction } = useWallet();
  const [url, setUrl] = useState("");
  const [tx, setTx] = useState<TxState>({ status: "idle" });
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreResult, setScoreResult] = useState<{
    score: number;
    breakdown?: Record<string, unknown>;
    onchainTx?: string | null;
  } | null>(null);

  async function submitProof() {
    if (!publicKey || !CONTRACT_IDS.stakePool || !url.trim()) return;
    setTx({ status: "pending" });
    setScoreResult(null);
    try {
      const hash = await buildAndSubmitTx(
        CONTRACT_IDS.stakePool,
        "submit_proof",
        [
          u64ToScVal(poolId),
          addressToScVal(publicKey),
          stringToScVal(url.trim()),
        ],
        publicKey,
        signTransaction,
      );
      setTx({ status: "success", hash });
      setScoreLoading(true);
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pool_id: poolId.toString(),
          member_address: publicKey,
          proof_url: url.trim(),
          goal,
        }),
      });
      const data = (await res.json()) as {
        score?: number;
        breakdown?: Record<string, unknown>;
        onchainTx?: string | null;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "score failed");
      setScoreResult({
        score: data.score ?? 0,
        breakdown: data.breakdown,
        onchainTx: data.onchainTx ?? null,
      });
    } catch (e) {
      setTx({
        status: "failed",
        error: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setScoreLoading(false);
    }
  }

  if (!publicKey) {
    return <p className="text-sm text-gray-500">Connect a wallet to submit proof.</p>;
  }

  return (
    <div className="space-y-3 max-w-lg">
      <label className="block text-sm text-gray-400">
        Proof URL (repo, demo, README)
      </label>
      <input
        className="w-full rounded-lg border border-stellar-border bg-stellar-dark px-3 py-2 text-sm text-white font-mono"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://github.com/…"
      />
      <button
        type="button"
        onClick={submitProof}
        disabled={tx.status === "pending" || scoreLoading || !url.trim()}
        className="px-4 py-2 rounded-lg bg-stellar-blue text-white text-sm font-medium disabled:opacity-50"
      >
        {scoreLoading ? "Scoring…" : "Submit proof & request AI score"}
      </button>
      <TxStatus state={tx} label="Submit proof" />
      {scoreLoading && (
        <p className="text-sm text-amber-200 flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          AI scoring in progress…
        </p>
      )}
      {scoreResult && (
        <div className="rounded-lg border border-stellar-border bg-stellar-dark/80 p-3 text-sm">
          <p className="text-emerald-300 font-semibold">Score: {scoreResult.score}</p>
          {scoreResult.breakdown && (
            <pre className="mt-2 text-xs text-gray-400 overflow-x-auto">
              {JSON.stringify(scoreResult.breakdown, null, 2)}
            </pre>
          )}
          {scoreResult.onchainTx && (
            <a
              className="text-stellar-blue text-xs underline mt-2 inline-block"
              href={`https://stellar.expert/explorer/testnet/tx/${scoreResult.onchainTx}`}
              target="_blank"
              rel="noreferrer"
            >
              Verdict tx
            </a>
          )}
        </div>
      )}
    </div>
  );
}
