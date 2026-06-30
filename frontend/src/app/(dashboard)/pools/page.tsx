"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useWallet } from "@/components/WalletConnect";
import { CONTRACT_IDS } from "@/lib/constants";
import { simulateTx, addressToScVal, u64ToScVal } from "@/lib/stellar";
import { readOptionalString } from "@/lib/ipfs";
import { NbInput } from "@/components/ui/NbInput";
import { FilterChip, PageHeader } from "@/components/ui/PageHeader";
import { PoolCardSkeleton } from "@/components/ui/NbSkeleton";
import { IpfsImage } from "@/components/IpfsImage";
import type { MemberView, PoolView, PoolStatus } from "@/types/pact";

function mapPool(raw: unknown): PoolView {
  const p = raw as Record<string, unknown>;
  const rawMembers = p.members as unknown[] | undefined;
  const members = Array.isArray(rawMembers)
    ? rawMembers.map((m) => (typeof m === "string" ? m : String(m)))
    : [];
  return {
    pool_id: BigInt(String(p.pool_id ?? 0)),
    creator: typeof p.creator === "string" ? p.creator : String(p.creator ?? ""),
    goal: String(p.goal ?? ""),
    deadline: BigInt(String(p.deadline ?? 0)),
    stake_amount: BigInt(String(p.stake_amount ?? 0)),
    members,
    status: String(p.status ?? "Active") as PoolStatus,
    threshold: Number(p.threshold ?? 60),
    cover_cid: readOptionalString(p.cover_cid),
  };
}

function statusBadge(status: PoolStatus) {
  if (status === "Active") return <span className="nb-badge">Active</span>;
  if (status === "Settling") return <span className="nb-badge-orange">Settling</span>;
  return <span className="nb-badge-green">Settled</span>;
}

function timeLeft(deadline: bigint, nowSec: number) {
  const left = Number(deadline) - nowSec;
  if (left <= 0) return "ENDED";
  const d = Math.floor(left / 86400);
  const h = Math.floor((left % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h LEFT` : `${h}h LEFT`;
}

function MemberRow({ m, rank }: { m: MemberView; rank: number }) {
  const score = m.ai_score ?? 0;
  const pct = Math.min(100, score);
  return (
    <div className="flex items-center gap-3 py-2 border-b border-black/10 last:border-0">
      <span className="text-black/40 font-mono text-xs w-5 text-right">{rank}</span>
      <div className="flex-1 min-w-0">
        <span className="font-mono text-xs text-black truncate block">
          {m.address.slice(0, 8)}…{m.address.slice(-4)}
        </span>
        <div className="flex gap-2 mt-0.5 flex-wrap">
          {m.staked && <span className="nb-badge-green text-[10px]">Staked</span>}
          {m.shipped && <span className="nb-badge text-[10px]">Shipped</span>}
          {m.proof_nft_id != null && (
            <span className="nb-badge text-[10px]">NFT #{m.proof_nft_id.toString()}</span>
          )}
          {m.peer_confirmations > 0 && (
            <span className="text-black/45 text-xs">+{m.peer_confirmations} peers</span>
          )}
        </div>
      </div>
      {m.ai_score != null ? (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-black/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-emerald-700 font-medium text-sm w-8 text-right">{score}</span>
        </div>
      ) : (
        <span className="text-black/40 text-xs w-8 text-right">—</span>
      )}
    </div>
  );
}

function PoolCard({
  pool,
  members,
  nowSec,
  expanded,
  onToggle,
}: {
  pool: PoolView;
  members: MemberView[];
  nowSec: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const sorted = [...members].sort(
    (a, b) => (b.ai_score ?? -1) - (a.ai_score ?? -1),
  );
  const shipped = members.filter((m) => m.shipped).length;
  const staked  = members.filter((m) => m.staked).length;

  return (
    <article className="nb-card overflow-hidden">
      <IpfsImage
        cid={pool.cover_cid}
        alt={pool.goal}
        className="aspect-[21/9] w-full border-b border-black/10"
      />
      <div className="p-5 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-black/50">
              #{pool.pool_id.toString()}
            </span>
            {statusBadge(pool.status)}
          </div>
          <p className="font-medium text-black text-base leading-snug landing-font-heading">{pool.goal}</p>
          <p className="font-mono text-xs text-black/45 mt-1 truncate">
            by {pool.creator.slice(0, 8)}…{pool.creator.slice(-4)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-medium text-sm text-black">{timeLeft(pool.deadline, nowSec)}</p>
          <p className="text-black/45 text-xs mt-1">
            {(Number(pool.stake_amount) / 1e7).toFixed(1)} XLM / member
          </p>
        </div>
      </header>

      <div>
        <div className="flex justify-between text-xs mb-1 text-black/45">
          <span>{staked} staked · {shipped} shipped</span>
          <span>{pool.members.length} members</span>
        </div>
        <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-black rounded-full"
            style={{
              width: pool.members.length
                ? `${Math.round((shipped / pool.members.length) * 100)}%`
                : "0%",
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-black/45">
          AI threshold: <strong className="text-black">{pool.threshold}</strong>
        </span>
        <button type="button" onClick={onToggle} className="nb-btn-ghost text-xs py-1 px-3">
          {expanded ? "Hide standings" : "Standings"}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-black/10 pt-4">
          <p className="text-xs text-black/45 mb-3">Member standings</p>
          {sorted.length === 0 ? (
            <p className="text-black/45 text-sm">No members yet.</p>
          ) : (
            <div>
              {sorted.map((m, i) => (
                <MemberRow key={m.address} m={m} rank={i + 1} />
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </article>
  );
}

type SortKey = "newest" | "deadline" | "stake" | "members";
type FilterStatus = "all" | PoolStatus;

export default function PoolsPage() {
  const { publicKey } = useWallet();
  const [pools, setPools] = useState<PoolView[]>([]);
  const [membersByPool, setMembersByPool] = useState<Record<string, MemberView[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [sort, setSort] = useState<SortKey>("newest");

  useEffect(() => {
    const t = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 30_000);
    return () => clearInterval(t);
  }, []);

  const load = useCallback(async () => {
    if (!publicKey || !CONTRACT_IDS.stakePool) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await simulateTx(CONTRACT_IDS.stakePool, "get_all_pools", [], publicKey) as unknown[];
      const mapped = raw.map(mapPool);
      setPools(mapped);

      const next: Record<string, MemberView[]> = {};
      for (const pool of mapped) {
        const key = pool.pool_id.toString();
        next[key] = [];
        for (const addr of pool.members) {
          try {
            const m = await simulateTx(
              CONTRACT_IDS.stakePool,
              "get_member",
              [u64ToScVal(pool.pool_id), addressToScVal(addr)],
              publicKey,
            ) as Record<string, unknown>;
            next[key].push({
              address: addr,
              staked: Boolean(m.staked),
              proof_url: m.proof_url != null ? String(m.proof_url) : null,
              proof_cid: readOptionalString(m.proof_cid),
              proof_image_cid: readOptionalString(m.proof_image_cid),
              ai_score: m.ai_score != null ? Number(m.ai_score) : null,
              peer_confirmations: Number(m.peer_confirmations ?? 0),
              shipped: Boolean(m.shipped),
              proof_nft_id: m.proof_nft_id != null ? BigInt(String(m.proof_nft_id)) : null,
            });
          } catch { /* skip */ }
        }
      }
      setMembersByPool(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = [...pools];
    if (filterStatus !== "all") list = list.filter((p) => p.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.goal.toLowerCase().includes(q) || p.creator.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      if (sort === "newest")   return Number(b.pool_id - a.pool_id);
      if (sort === "deadline") return Number(a.deadline - b.deadline);
      if (sort === "stake")    return Number(b.stake_amount - a.stake_amount);
      if (sort === "members")  return b.members.length - a.members.length;
      return 0;
    });
    return list;
  }, [pools, filterStatus, search, sort]);

  const STATUS_FILTERS: { key: FilterStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "Active", label: "Active" },
    { key: "Settling", label: "Settling" },
    { key: "Settled", label: "Settled" },
  ];

  return (
    <div className="space-y-8 pb-16">
      <PageHeader eyebrow="On-chain accountability" title="Pool standings">
        <div className="flex gap-3">
          <Link href="/app" className="nb-btn-yellow text-xs">
            Create pool
          </Link>
          <button
            type="button"
            onClick={load}
            disabled={loading || !publicKey}
            className="nb-btn-ghost text-xs disabled:opacity-40"
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
      </PageHeader>

      {!publicKey && (
        <div className="nb-card p-8 text-center space-y-3">
          <p className="text-xl font-medium text-black landing-font-heading">Connect wallet to browse pools</p>
          <p className="text-black/55 text-sm">Wallet needed to simulate on-chain reads.</p>
          <Link href="/" className="nb-btn-yellow text-sm inline-flex">
            Go home
          </Link>
        </div>
      )}

      {error && (
        <div className="nb-card p-4 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      {publicKey && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <NbInput
            className="sm:max-w-xs"
            placeholder="Search goals…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Status pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <FilterChip
                key={f.key}
                active={filterStatus === f.key}
                onClick={() => setFilterStatus(f.key)}
              >
                {f.label}
                {f.key === "all"
                  ? ` (${pools.length})`
                  : ` (${pools.filter((p) => p.status === f.key).length})`}
              </FilterChip>
            ))}
          </div>

          {/* Sort */}
          <select
            className="nb-input sm:w-auto sm:max-w-[160px] cursor-pointer"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="newest">Newest first</option>
            <option value="deadline">Deadline soonest</option>
            <option value="stake">Highest stake</option>
            <option value="members">Most members</option>
          </select>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <PoolCardSkeleton />
          <PoolCardSkeleton />
          <PoolCardSkeleton />
          <PoolCardSkeleton />
        </div>
      )}

      {/* Pool grid */}
      {!loading && publicKey && (
        <>
          {filtered.length === 0 ? (
            <div className="nb-card p-10 text-center">
              <p className="text-black/55 font-medium text-lg">No pools found</p>
              {pools.length === 0
                ? <p className="text-black/45 text-sm mt-2">No pools on-chain yet. <Link href="/app" className="text-black underline">Create the first one.</Link></p>
                : <p className="text-black/45 text-sm mt-2">Try different filters.</p>
              }
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((pool) => {
                const key = pool.pool_id.toString();
                return (
                  <PoolCard
                    key={key}
                    pool={pool}
                    members={membersByPool[key] ?? []}
                    nowSec={nowSec}
                    expanded={!!expanded[key]}
                    onToggle={() =>
                      setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
