"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useWallet } from "@/components/WalletConnect";
import { CONTRACT_IDS } from "@/lib/constants";
import { simulateTx, addressToScVal, u64ToScVal } from "@/lib/stellar";
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
  };
}

const CARD_ACCENTS = [
  { card: "nb-card-yellow", badge: "nb-badge-yellow", text: "text-nb-yellow" },
  { card: "nb-card-pink",   badge: "nb-badge-pink",   text: "text-nb-pink"   },
  { card: "nb-card-green",  badge: "nb-badge-green",  text: "text-nb-green"  },
  { card: "nb-card-orange", badge: "nb-badge-orange", text: "text-nb-orange" },
  { card: "nb-card-blue",   badge: "nb-badge-yellow", text: "text-nb-blue"   },
] as const;

function statusBadge(status: PoolStatus) {
  if (status === "Active")   return <span className="nb-badge-yellow">ACTIVE</span>;
  if (status === "Settling") return <span className="nb-badge-orange">SETTLING</span>;
  return <span className="nb-badge-green">SETTLED</span>;
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
    <div className="flex items-center gap-3 py-2 border-b border-white/10 last:border-0">
      <span className="text-nb-muted font-mono text-xs w-5 text-right">{rank}</span>
      <div className="flex-1 min-w-0">
        <span className="font-mono text-xs text-white truncate block">
          {m.address.slice(0, 8)}…{m.address.slice(-4)}
        </span>
        <div className="flex gap-2 mt-0.5">
          {m.staked  && <span className="text-nb-green text-xs font-bold">STAKED</span>}
          {m.shipped && <span className="text-nb-yellow text-xs font-bold">SHIPPED</span>}
          {m.peer_confirmations > 0 && (
            <span className="text-nb-pink text-xs">+{m.peer_confirmations} PEERS</span>
          )}
        </div>
      </div>
      {m.ai_score != null ? (
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-white/10 border border-white/20">
            <div
              className="h-full bg-nb-green"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-nb-green font-black text-sm w-8 text-right">
            {score}
          </span>
        </div>
      ) : (
        <span className="text-nb-muted text-xs w-8 text-right">—</span>
      )}
    </div>
  );
}

function PoolCard({
  pool,
  members,
  accent,
  nowSec,
  expanded,
  onToggle,
}: {
  pool: PoolView;
  members: MemberView[];
  accent: typeof CARD_ACCENTS[number];
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
    <article className={`${accent.card} p-5 space-y-4`}>
      <header className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-mono text-xs font-bold ${accent.text}`}>
              #{pool.pool_id.toString()}
            </span>
            {statusBadge(pool.status)}
          </div>
          <p className="font-bold text-white text-base leading-snug">{pool.goal}</p>
          <p className="font-mono text-xs text-nb-muted mt-1 truncate">
            by {pool.creator.slice(0, 8)}…{pool.creator.slice(-4)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className={`font-black text-sm ${accent.text}`}>
            {timeLeft(pool.deadline, nowSec)}
          </p>
          <p className="text-nb-muted text-xs mt-1">
            {(Number(pool.stake_amount) / 1e7).toFixed(1)} XLM / member
          </p>
        </div>
      </header>

      {/* Progress bar: shipped / total */}
      <div>
        <div className="flex justify-between text-xs font-bold uppercase mb-1">
          <span className="text-nb-muted">{staked} STAKED · {shipped} SHIPPED</span>
          <span className={accent.text}>{pool.members.length} MEMBERS</span>
        </div>
        <div className="h-2 bg-white/10 border border-white/20">
          <div
            className={`h-full ${
              accent.text === "text-nb-yellow" ? "bg-nb-yellow" :
              accent.text === "text-nb-pink"   ? "bg-nb-pink"   :
              accent.text === "text-nb-green"  ? "bg-nb-green"  :
              accent.text === "text-nb-blue"   ? "bg-nb-blue"   :
              "bg-nb-orange"
            }`}
            style={{
              width: pool.members.length
                ? `${Math.round((shipped / pool.members.length) * 100)}%`
                : "0%",
            }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-3 text-xs text-nb-muted">
          <span>AI THRESHOLD: <strong className="text-white">{pool.threshold}</strong></span>
        </div>
        <button
          type="button"
          onClick={onToggle}
          className={`text-xs font-black uppercase border-2 px-3 py-1 transition-all ${accent.text} ${
            accent.text === "text-nb-yellow" ? "border-nb-yellow hover:bg-nb-yellow hover:text-black" :
            accent.text === "text-nb-pink"   ? "border-nb-pink   hover:bg-nb-pink   hover:text-black" :
            accent.text === "text-nb-green"  ? "border-nb-green  hover:bg-nb-green  hover:text-black" :
            accent.text === "text-nb-blue"   ? "border-nb-blue   hover:bg-nb-blue   hover:text-white" :
            "border-nb-orange hover:bg-nb-orange hover:text-black"
          }`}
        >
          {expanded ? "▲ HIDE" : "▼ STANDINGS"}
        </button>
      </div>

      {expanded && (
        <div className="border-t-2 border-white/20 pt-4">
          <p className="text-xs font-black uppercase tracking-widest text-nb-muted mb-3">
            MEMBER STANDINGS
          </p>
          {sorted.length === 0 ? (
            <p className="text-nb-muted text-sm">No members yet.</p>
          ) : (
            <div>
              {sorted.map((m, i) => (
                <MemberRow key={m.address} m={m} rank={i + 1} />
              ))}
            </div>
          )}
        </div>
      )}
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
              ai_score: m.ai_score != null ? Number(m.ai_score) : null,
              peer_confirmations: Number(m.peer_confirmations ?? 0),
              shipped: Boolean(m.shipped),
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
    { key: "all",      label: "ALL"      },
    { key: "Active",   label: "ACTIVE"   },
    { key: "Settling", label: "SETTLING" },
    { key: "Settled",  label: "SETTLED"  },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-3 border-white pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-2">
            ON-CHAIN ACCOUNTABILITY
          </p>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
            POOL <span className="text-nb-yellow">STANDINGS</span>
          </h1>
        </div>
        <div className="flex gap-3">
          <Link href="/app" className="nb-btn-yellow text-xs">
            + CREATE POOL
          </Link>
          <button
            type="button"
            onClick={load}
            disabled={loading || !publicKey}
            className="nb-btn-ghost text-xs disabled:opacity-40"
          >
            {loading ? "LOADING…" : "↺ REFRESH"}
          </button>
        </div>
      </div>

      {!publicKey && (
        <div className="nb-card-yellow p-6 text-center space-y-3">
          <p className="font-black text-xl uppercase text-white">CONNECT WALLET TO BROWSE POOLS</p>
          <p className="text-nb-muted text-sm">Wallet needed to simulate on-chain reads.</p>
          <Link href="/" className="nb-btn-yellow text-sm inline-flex">
            GO HOME →
          </Link>
        </div>
      )}

      {error && (
        <div className="nb-card p-4 border-nb-red" style={{ boxShadow: "4px 4px 0 #FF3B3B" }}>
          <p className="text-nb-red font-bold text-sm">{error}</p>
        </div>
      )}

      {/* Filters */}
      {publicKey && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <input
            className="nb-input sm:max-w-xs"
            placeholder="SEARCH GOALS…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Status pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilterStatus(f.key)}
                className={`text-xs font-black uppercase border-2 px-3 py-1.5 transition-all ${
                  filterStatus === f.key
                    ? "bg-nb-yellow text-black border-nb-yellow"
                    : "border-white text-white hover:border-nb-yellow hover:text-nb-yellow"
                }`}
              >
                {f.label}
                {f.key === "all"
                  ? ` (${pools.length})`
                  : ` (${pools.filter((p) => p.status === f.key).length})`}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            className="nb-input sm:w-auto sm:max-w-[160px] cursor-pointer"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
          >
            <option value="newest">NEWEST FIRST</option>
            <option value="deadline">DEADLINE SOONEST</option>
            <option value="stake">HIGHEST STAKE</option>
            <option value="members">MOST MEMBERS</option>
          </select>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="nb-card p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-white/10 w-1/3" />
              <div className="h-6 bg-white/10 w-3/4" />
              <div className="h-3 bg-white/10 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Pool grid */}
      {!loading && publicKey && (
        <>
          {filtered.length === 0 ? (
            <div className="nb-card p-10 text-center">
              <p className="text-nb-muted font-bold uppercase text-lg">NO POOLS FOUND</p>
              {pools.length === 0
                ? <p className="text-nb-muted text-sm mt-2">No pools on-chain yet. <Link href="/app" className="text-nb-yellow underline">Create the first one.</Link></p>
                : <p className="text-nb-muted text-sm mt-2">Try different filters.</p>
              }
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((pool, i) => {
                const accent = CARD_ACCENTS[Number(pool.pool_id) % CARD_ACCENTS.length];
                const key = pool.pool_id.toString();
                return (
                  <PoolCard
                    key={key}
                    pool={pool}
                    members={membersByPool[key] ?? []}
                    accent={accent}
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
