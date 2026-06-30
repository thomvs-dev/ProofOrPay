"use client";

import { useEffect, useState, useCallback } from "react";
import { CONTRACT_IDS } from "@/lib/constants";
import { NbCard } from "@/components/ui/NbCard";
import { NbButton } from "@/components/ui/NbButton";
import { PageHeader } from "@/components/ui/PageHeader";
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
      <PageHeader eyebrow="On-chain stats" title="Protocol metrics">
        <div className="flex gap-3 self-start sm:self-auto">
          <NbButton variant="ghost" href="/pools" className="text-xs">
            Pools
          </NbButton>
          <NbButton
            variant="ghost"
            className="text-xs"
            onClick={load}
            loading={loading}
            disabled={loading}
          >
            Refresh
          </NbButton>
        </div>
      </PageHeader>

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
            <NbCard className="p-6 space-y-2">
              <p className="font-medium text-lg text-black landing-font-heading">Unavailable</p>
              <p className="text-black/55 text-sm">{data.error ?? data.message ?? "API error"}</p>
              <NbButton variant="orange" className="text-xs mt-2" onClick={load}>
                Retry
              </NbButton>
              {!data.configured && (
                <p className="text-black/45 text-xs font-mono mt-2">
                  Set METRICS_SIMULATION_PUBLIC_KEY (funded testnet G… account) in Vercel env vars to enable server-side reads.
                </p>
              )}
            </NbCard>
          )}

          {data.ok && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <NbCard className="p-5">
                  <p className="text-xs text-black/45 mb-1">Pools</p>
                  <p className="text-4xl font-medium text-black landing-font-heading">{data.pool_count ?? 0}</p>
                </NbCard>
                <NbCard className="p-5">
                  <p className="text-xs text-black/45 mb-1">Members</p>
                  <p className="text-4xl font-medium text-black landing-font-heading">{data.members_total ?? 0}</p>
                </NbCard>
                <NbCard className="p-5 col-span-2 sm:col-span-1">
                  <p className="text-xs text-black/45 mb-1">Leaderboard</p>
                  <p className="text-4xl font-medium text-black landing-font-heading">{data.leaderboard_entries ?? 0}</p>
                </NbCard>
              </div>

              {data.pools && data.pools.length > 0 && (
                <NbCard className="p-5 space-y-3">
                  <p className="text-xs text-black/45">Pools breakdown</p>
                  <div className="space-y-2">
                    {data.pools.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between border border-black/10 rounded-lg px-3 py-2"
                      >
                        <span className="font-mono text-sm text-black">Pool #{p.id}</span>
                        <div className="flex gap-3 text-xs text-black/55">
                          <span>{p.members} members</span>
                          <span className="font-medium text-black">{p.status}</span>
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
        <p className="text-xs text-black/45 mb-1">Contract</p>
        <p className="font-mono text-xs text-black break-all">
          {CONTRACT_IDS.stakePool || "(unset)"}
        </p>
      </NbCard>
    </div>
  );
}
