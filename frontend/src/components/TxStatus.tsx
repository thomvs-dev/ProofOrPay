"use client";

import { useEffect } from "react";

export type TxState = {
  status: "idle" | "pending" | "success" | "failed";
  hash?: string;
  error?: string;
};

const explorer = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;

export function TxStatus({
  state,
  label = "Transaction",
  onDismiss,
  onRetry,
}: {
  state: TxState;
  label?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
}) {
  useEffect(() => {
    if (state.status !== "success" || !onDismiss) return;
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [state.status, onDismiss]);

  if (state.status === "idle") return null;

  const styles =
    state.status === "pending"
      ? "border-amber-200 bg-amber-50"
      : state.status === "success"
        ? "border-emerald-200 bg-emerald-50"
        : "border-red-200 bg-red-50";

  return (
    <div className={`nb-card p-3 text-sm ${styles}`} role="status">
      <p className="text-xs text-black/45 mb-1">{label}</p>
      {state.status === "pending" && (
        <div className="flex items-center gap-2 text-black/70 text-xs">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-black/30 border-t-transparent" />
          Submitting…
        </div>
      )}
      {state.status === "success" && (
        <div className="text-emerald-800 text-xs space-y-1">
          <p className="font-medium">Success</p>
          {state.hash && (
            <a
              href={explorer(state.hash)}
              target="_blank"
              rel="noreferrer"
              className="underline font-mono block text-black/70"
            >
              View on Stellar Expert →
            </a>
          )}
        </div>
      )}
      {state.status === "failed" && (
        <div className="space-y-2">
          <p className="text-red-800 text-xs">{state.error ?? "Failed"}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="text-xs text-black underline"
            >
              Try again
            </button>
          )}
        </div>
      )}
    </div>
  );
}
