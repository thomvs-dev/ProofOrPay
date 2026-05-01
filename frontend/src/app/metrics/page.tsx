"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONTRACT_IDS } from "@/lib/constants";

type ApiMetrics = {
  ok: boolean;
  configured?: boolean;
  pool_count?: number;
  members_total?: number;
  leaderboard_entries?: number;
  pools?: { id: string; members: number; status: string }[];
  message?: string;
  error?: string;
};

export default function MetricsPage() {
  const [data, setData] = useState<ApiMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/metrics");
        const j = (await r.json()) as ApiMetrics;
        if (!cancelled) setData(j);
      } catch (e) {
        if (!cancelled)
          setData({ ok: false, error: e instanceof Error ? e.message : String(e) });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-3 border-white pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-2">ON-CHAIN STATS</p>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
            PROTOCOL <span className="text-nb-green">METRICS</span>
          </h1>
        </div>
        <Link href="/pools" className="nb-btn-ghost text-xs self-start sm:self-auto">
          ← POOLS
        </Link>
      </div>

      {loading && (
        <div className="flex items-center gap-3">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-3 border-nb-green border-t-transparent" />
          <span className="text-nb-muted font-bold uppercase text-sm">LOADING…</span>
        </div>
      )}

      {!loading && data && (
        <>
          {!data.ok && (
            <div className="nb-card-orange p-6 space-y-2">
              <p className="font-black text-lg uppercase text-white">UNAVAILABLE</p>
              <p className="text-nb-muted text-sm">{data.error ?? data.message ?? "API error"}</p>
              {!data.configured && (
                <p className="text-nb-orange text-xs font-mono mt-2">
                  Set METRICS_SIMULATION_PUBLIC_KEY (funded testnet G… account) in Vercel env vars to enable server-side reads.
                </p>
              )}
            </div>
          )}

          {data.ok && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="nb-card-green p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-1">POOLS</p>
                  <p className="text-4xl font-black text-nb-green">{data.pool_count ?? 0}</p>
                </div>
                <div className="nb-card-yellow p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-1">MEMBERS</p>
                  <p className="text-4xl font-black text-nb-yellow">{data.members_total ?? 0}</p>
                </div>
                <div className="nb-card-pink p-5 col-span-2 sm:col-span-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-1">LEADERBOARD</p>
                  <p className="text-4xl font-black text-nb-pink">{data.leaderboard_entries ?? 0}</p>
                </div>
              </div>

              {data.pools && data.pools.length > 0 && (
                <div className="nb-card p-5 space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-nb-muted">POOLS BREAKDOWN</p>
                  <div className="space-y-2">
                    {data.pools.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between border border-white/20 px-3 py-2"
                      >
                        <span className="font-mono text-sm text-white">POOL #{p.id}</span>
                        <div className="flex gap-3 text-xs">
                          <span className="text-nb-muted">{p.members} MEMBERS</span>
                          <span className={`font-bold uppercase ${
                            p.status === "Active" ? "text-nb-yellow" :
                            p.status === "Settling" ? "text-nb-orange" :
                            "text-nb-green"
                          }`}>{p.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <div className="nb-card p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-1">CONTRACT</p>
        <p className="font-mono text-xs text-white break-all">
          {CONTRACT_IDS.stakePool || "(unset)"}
        </p>
      </div>
    </div>
  );
}
