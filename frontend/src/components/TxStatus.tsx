"use client";

export type TxState = {
  status: "idle" | "pending" | "success" | "failed";
  hash?: string;
  error?: string;
};

const explorer = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;

export function TxStatus({ state, label = "TX" }: { state: TxState; label?: string }) {
  if (state.status === "idle") return null;

  return (
    <div
      className={`border-3 p-3 text-sm ${
        state.status === "pending" ? "border-nb-yellow bg-nb-card" :
        state.status === "success" ? "border-nb-green  bg-nb-card" :
        "border-nb-red bg-nb-card"
      }`}
      style={{
        boxShadow:
          state.status === "pending" ? "3px 3px 0 #FFE500" :
          state.status === "success" ? "3px 3px 0 #00FF94" :
          "3px 3px 0 #FF3B3B",
      }}
    >
      <p className="text-xs font-black uppercase tracking-widest text-nb-muted mb-1">{label}</p>
      {state.status === "pending" && (
        <div className="flex items-center gap-2 text-nb-yellow font-bold uppercase text-xs">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-nb-yellow border-t-transparent" />
          SUBMITTING…
        </div>
      )}
      {state.status === "success" && (
        <div className="text-nb-green font-black uppercase text-xs">
          ✓ SUCCESS
          {state.hash && (
            <>
              {" — "}
              <a
                href={explorer(state.hash)}
                target="_blank"
                rel="noreferrer"
                className="underline font-mono"
              >
                {state.hash.slice(0, 10)}…
              </a>
            </>
          )}
        </div>
      )}
      {state.status === "failed" && (
        <div className="text-nb-red font-bold uppercase text-xs flex items-start gap-2">
          <span>✕</span>
          <span className="normal-case font-normal">{state.error ?? "Failed"}</span>
        </div>
      )}
    </div>
  );
}
