"use client";

import { useEffect, useState, useCallback } from "react";
import { CONTRACT_IDS } from "@/lib/constants";
import { NbCard } from "@/components/ui/NbCard";
import { NbButton } from "@/components/ui/NbButton";
import { PoolCardSkeleton } from "@/components/ui/NbSkeleton";

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/metrics");
      const j = (await r.json()) as ApiMetrics;
      setData(j);
    } catch (e) {
      setData({ ok: false, error: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-3 border-white pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-2">ON-CHAIN STATS</p>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
            PROTOCOL <span className="text-nb-green">METRICS</span>
          </h1>
        </div>
        <div className="flex gap-3 self-start sm:self-auto">
          <NbButton variant="ghost" href="/pools" className="text-xs">
            ← POOLS
          </NbButton>
          <NbButton
            variant="ghost"
            className="text-xs"
            onClick={load}
            loading={loading}
            disabled={loading}
          >
            ↺ REFRESH
          </NbButton>
        </div>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <PoolCardSkeleton />
          <PoolCardSkeleton />
          <PoolCardSkeleton />
        </div>
      )}

      {!loading && data && (
        <>
          {!data.ok && (
            <NbCard accent="orange" className="p-6 space-y-2">
              <p className="font-black text-lg uppercase text-white">UNAVAILABLE</p>
              <p className="text-nb-muted text-sm">{data.error ?? data.message ?? "API error"}</p>
              <NbButton variant="orange" className="text-xs mt-2" onClick={load}>
                RETRY
              </NbButton>
              {!data.configured && (
                <p className="text-nb-orange text-xs font-mono mt-2">
                  Set METRICS_SIMULATION_PUBLIC_KEY (funded testnet G… account) in Vercel env vars to enable server-side reads.
                </p>
              )}
            </NbCard>
          )}

          {data.ok && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <NbCard accent="green" className="p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-1">POOLS</p>
                  <p className="text-4xl font-black text-nb-green">{data.pool_count ?? 0}</p>
                </NbCard>
                <NbCard accent="yellow" className="p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-1">MEMBERS</p>
                  <p className="text-4xl font-black text-nb-yellow">{data.members_total ?? 0}</p>
                </NbCard>
                <NbCard accent="pink" className="p-5 col-span-2 sm:col-span-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-1">LEADERBOARD</p>
                  <p className="text-4xl font-black text-nb-pink">{data.leaderboard_entries ?? 0}</p>
                </NbCard>
              </div>

              {data.pools && data.pools.length > 0 && (
                <NbCard className="p-5 space-y-3">
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
                </NbCard>
              )}
            </>
          )}
        </>
      )}

      <NbCard className="p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-1">CONTRACT</p>
        <p className="font-mono text-xs text-white break-all">
          {CONTRACT_IDS.stakePool || "(unset)"}
        </p>
      </NbCard>
    </div>
  );
}
