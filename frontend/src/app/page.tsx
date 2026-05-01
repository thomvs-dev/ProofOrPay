"use client";

import Link from "next/link";
import { useWallet } from "@/components/WalletConnect";

const STEPS = [
  {
    n: "01",
    color: "nb-card-yellow",
    badge: "text-nb-yellow",
    title: "CREATE OR JOIN",
    body: "Connect a Stellar wallet. Create a pool with a goal, deadline, and stake — or join an existing one.",
  },
  {
    n: "02",
    color: "nb-card-pink",
    badge: "text-nb-pink",
    title: "PROVE & SCORE",
    body: "Submit a link to your work. An AI judge scores it on-chain. No humans, no bias, no excuses.",
  },
  {
    n: "03",
    color: "nb-card-green",
    badge: "text-nb-green",
    title: "PEERS & SETTLE",
    body: "Members vouch for each other. After the deadline, anyone triggers settlement — stakes flow to winners.",
  },
];

const STATS = [
  { label: "Network", value: "Testnet", color: "text-nb-yellow" },
  { label: "Chain", value: "Soroban", color: "text-nb-pink" },
  { label: "Judge", value: "AI + Peers", color: "text-nb-green" },
  { label: "Custody", value: "Non-custodial", color: "text-nb-orange" },
];

export default function LandingPage() {
  const { publicKey, connect, isConnecting } = useWallet();

  return (
    <div className="space-y-16 pb-24">
      {/* Hero */}
      <section className="pt-8 sm:pt-16">
        <div className="flex flex-col gap-6 max-w-4xl">
          <div className="inline-block">
            <span className="nb-badge-yellow text-xs">
              ◆ STELLAR TESTNET · SOROBAN
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black uppercase leading-[0.9] tracking-tighter">
            <span className="text-white">STAKE</span>
            <br />
            <span className="text-nb-yellow">YOUR WORD.</span>
            <br />
            <span className="text-nb-pink">SHIP</span>
            <span className="text-white"> OR </span>
            <span className="text-nb-orange">LOSE.</span>
          </h1>

          <p className="text-lg sm:text-xl text-nb-muted max-w-xl leading-relaxed">
            Accountability pools on-chain. Lock XLM with your team, prove you shipped,
            let AI + peers judge. No mercy for slackers.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            {!publicKey ? (
              <button
                type="button"
                onClick={connect}
                disabled={isConnecting}
                className="nb-btn-yellow text-sm disabled:opacity-50"
              >
                {isConnecting ? "CONNECTING…" : "CONNECT WALLET →"}
              </button>
            ) : (
              <Link href="/app" className="nb-btn-yellow text-sm">
                LAUNCH APP →
              </Link>
            )}
            <Link href="/pools" className="nb-btn-ghost text-sm">
              BROWSE POOLS
            </Link>
          </div>
        </div>

        {/* Stats strip */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div key={s.label} className="nb-card p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-1">
                {s.label}
              </p>
              <p className={`text-lg font-black uppercase ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="border-t-3 border-white" />

      {/* How it works */}
      <section>
        <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-6">
          HOW IT WORKS
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className={`${s.color} p-6 space-y-4`}>
              <span className={`text-4xl font-black ${s.badge}`}>{s.n}</span>
              <h3 className="text-xl font-black uppercase tracking-tight text-white">
                {s.title}
              </h3>
              <p className="text-sm text-nb-muted leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature callouts */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="nb-card-pink p-6 space-y-3">
          <p className="text-nb-pink font-black uppercase text-sm tracking-widest">
            AI VERIFICATION
          </p>
          <p className="text-3xl font-black text-white uppercase leading-tight">
            NO HUMAN<br />BIAS
          </p>
          <p className="text-nb-muted text-sm">
            Scores are computed by an AI model, recorded on-chain by a verifier key.
            Tamper-proof accountability.
          </p>
        </div>
        <div className="nb-card-green p-6 space-y-3">
          <p className="text-nb-green font-black uppercase text-sm tracking-widest">
            PEER VOUCHING
          </p>
          <p className="text-3xl font-black text-white uppercase leading-tight">
            YOUR CREW<br />DECIDES
          </p>
          <p className="text-nb-muted text-sm">
            Members confirm each other. Combined with AI scores and thresholds,
            the contract makes final settlement calls automatically.
          </p>
        </div>
        <div className="nb-card-orange p-6 space-y-3">
          <p className="text-nb-orange font-black uppercase text-sm tracking-widest">
            NON-CUSTODIAL
          </p>
          <p className="text-3xl font-black text-white uppercase leading-tight">
            YOUR KEYS<br />YOUR STAKE
          </p>
          <p className="text-nb-muted text-sm">
            Funds locked in a Soroban smart contract. No backend holds your XLM.
            Settlement is permissionless.
          </p>
        </div>
        <div className="nb-card-yellow p-6 space-y-3">
          <p className="text-nb-yellow font-black uppercase text-sm tracking-widest">
            REPUTATION
          </p>
          <p className="text-3xl font-black text-white uppercase leading-tight">
            BUILD YOUR<br />ON-CHAIN REP
          </p>
          <p className="text-nb-muted text-sm">
            Every settled pool updates your reputation ledger. Winners build credibility.
            Shippers get rewarded.
          </p>
        </div>
      </section>

      {/* CTA banner */}
      <section className="nb-card-yellow p-8 sm:p-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="text-nb-yellow text-xs font-bold uppercase tracking-widest mb-2">
              READY?
            </p>
            <p className="text-4xl font-black text-white uppercase leading-tight">
              PUT YOUR XLM<br />WHERE YOUR MOUTH IS.
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
                {isConnecting ? "CONNECTING…" : "START NOW →"}
              </button>
            ) : (
              <Link href="/app" className="nb-btn-yellow text-sm whitespace-nowrap">
                OPEN APP →
              </Link>
            )}
            <Link href="/pools" className="nb-btn-ghost text-sm whitespace-nowrap">
              VIEW POOLS
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
