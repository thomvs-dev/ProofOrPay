"use client";

import Link from "next/link";
import { useWallet } from "@/components/WalletConnect";

const STEPS = [
  {
    n: "01",
    title: "Create or join",
    body: "Connect a Stellar wallet. Create a pool with a goal, deadline, and stake — or join an existing one.",
  },
  {
    n: "02",
    title: "Prove & score",
    body: "Submit a link to your work. An AI judge scores it on-chain. No humans, no bias, no excuses.",
  },
  {
    n: "03",
    title: "Peers & settle",
    body: "Members vouch for each other. After the deadline, anyone triggers settlement — stakes flow to winners.",
  },
];

const STATS = [
  { label: "Network", value: "Testnet" },
  { label: "Chain", value: "Soroban" },
  { label: "Judge", value: "AI + Peers" },
  { label: "Custody", value: "Non-custodial" },
];

export function HowItWorksSection() {
  const { publicKey, connect, isConnecting } = useWallet();

  return (
    <section
      id="how-it-works"
      className="relative z-[1] bg-pop-bg text-pop-text py-20 px-5 sm:px-8 md:px-10 border-t border-black/5"
    >
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div key={s.label} className="nb-card p-4">
              <p className="text-xs text-black/45 mb-1">{s.label}</p>
              <p className="text-lg font-medium text-black landing-font-heading">{s.value}</p>
            </div>
          ))}
        </div>

        <div>
          <p className="pop-page-eyebrow">How it works</p>
          <h2 className="pop-page-title mb-8">Three steps to ship on-chain</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="nb-card p-6 space-y-3">
                <span className="text-sm text-black/40 landing-font-heading">{s.n}</span>
                <h3 className="text-lg font-medium text-black landing-font-heading">{s.title}</h3>
                <p className="text-sm text-black/55 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="nb-card p-6 space-y-3">
            <p className="text-xs text-black/45 uppercase tracking-wide">AI verification</p>
            <p className="text-2xl font-medium text-black landing-font-heading leading-tight">
              No human bias
            </p>
            <p className="text-black/55 text-sm">
              Scores are computed by an AI model, recorded on-chain by a verifier key.
              Tamper-proof accountability.
            </p>
          </div>
          <div className="nb-card p-6 space-y-3">
            <p className="text-xs text-black/45 uppercase tracking-wide">Peer vouching</p>
            <p className="text-2xl font-medium text-black landing-font-heading leading-tight">
              Your crew decides
            </p>
            <p className="text-black/55 text-sm">
              Members confirm each other. Combined with AI scores and thresholds,
              the contract makes final settlement calls automatically.
            </p>
          </div>
        </section>

        <section className="nb-card p-8 sm:p-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <p className="pop-page-eyebrow">Ready?</p>
              <p className="text-2xl sm:text-3xl font-medium text-black landing-font-heading leading-tight">
                Put your XLM where your mouth is.
              </p>
            </div>
            <div className="flex flex-col gap-3 min-w-fit">
              {!publicKey ? (
                <button
                  type="button"
                  onClick={connect}
                  disabled={isConnecting}
                  className="nb-btn-yellow text-sm whitespace-nowrap disabled:opacity-50"
                >
                  {isConnecting ? "Connecting…" : "Start now"}
                </button>
              ) : (
                <Link href="/app" className="nb-btn-yellow text-sm whitespace-nowrap">
                  Open app
                </Link>
              )}
              <Link href="/pools" className="nb-btn-ghost text-sm whitespace-nowrap">
                View pools
              </Link>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
