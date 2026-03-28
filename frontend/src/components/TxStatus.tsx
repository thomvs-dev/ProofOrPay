"use client";

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
}: {
  state: TxState;
  label?: string;
}) {
  if (state.status === "idle") return null;

  return (
    <div className="rounded-lg border border-stellar-border bg-stellar-card p-3 text-sm">
      <p className="text-gray-400 mb-1">{label}</p>
      {state.status === "pending" && (
        <div className="flex items-center gap-2 text-amber-200">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
          Submitting…
        </div>
      )}
      {state.status === "success" && state.hash && (
        <div className="text-emerald-400">
          Success —{" "}
          <a
            href={explorer(state.hash)}
            target="_blank"
            rel="noreferrer"
            className="underline font-mono text-xs"
          >
            {state.hash.slice(0, 10)}…
          </a>
        </div>
      )}
      {state.status === "failed" && (
        <div className="text-red-400 flex items-start gap-2">
          <span aria-hidden>✕</span>
          <span>{state.error ?? "Failed"}</span>
        </div>
      )}
    </div>
  );
}
