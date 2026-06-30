"use client";

import { useEffect, useState, useCallback } from "react";
import { useWallet } from "@/components/WalletConnect";
import { CONTRACT_IDS } from "@/lib/constants";
import { simulateTx, addressToScVal, u64ToScVal } from "@/lib/stellar";
import { CreatePoolForm } from "@/components/CreatePoolForm";
import { StakeForm } from "@/components/StakeForm";
import { SubmissionForm } from "@/components/SubmissionForm";
import { ConfirmPeerForm } from "@/components/ConfirmPeerForm";
import { SettlePoolButton } from "@/components/SettlePoolButton";
import type { MemberView, PoolView } from "@/types/pact";

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
    status: String(p.status ?? "Active") as PoolView["status"],
    threshold: Number(p.threshold ?? 60),
  };
}

function usePoolsRefresh(publicKey: string | null) {
  const [pools, setPools] = useState<PoolView[]>([]);
  const [membersByPool, setMembersByPool] = useState<Record<string, MemberView[]>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const refresh = useCallback(() => setRefreshToken((n) => n + 1), []);

  useEffect(() => {
    if (!CONTRACT_IDS.stakePool || !publicKey) {
      setPools([]);
      setMembersByPool({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const raw = await simulateTx(CONTRACT_IDS.stakePool, "get_all_pools", [], publicKey) as unknown[];
        if (cancelled) return;
        const mapped = raw.map(mapPool);
        setPools(mapped);
        setLoadError(null);

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
        if (!cancelled) setMembersByPool(next);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : String(e));
          setPools([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [publicKey, refreshToken]);

  return { pools, membersByPool, loadError, loading, refresh };
}

function ActionSection({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${accent} p-5 space-y-3`}>
      <p className="text-xs font-black uppercase tracking-widest text-nb-muted">{title}</p>
      {children}
    </div>
  );
}

export default function AppPage() {
  const { publicKey, connect, isConnecting } = useWallet();
  const { pools, membersByPool, loadError, loading, refresh } = usePoolsRefresh(publicKey);
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (pools.length === 0) { setSelectedPoolId(null); return; }
    setSelectedPoolId((prev) => {
      if (prev && pools.some((p) => p.pool_id.toString() === prev)) return prev;
      return pools[0].pool_id.toString();
    });
  }, [pools]);

  const activePool = pools.find((p) => p.pool_id.toString() === selectedPoolId) ?? pools[0] ?? null;
  const activeMembers = activePool ? (membersByPool[activePool.pool_id.toString()] ?? []) : [];

  if (!publicKey) {
    return (
      <div className="space-y-8 pb-16">
        <div className="border-b-3 border-white pb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-2">PACT PROTOCOL</p>
          <h1 className="text-5xl font-black uppercase tracking-tight text-white">
            LAUNCH <span className="text-nb-green">APP</span>
          </h1>
        </div>
        <div className="nb-card-yellow p-10 flex flex-col items-center gap-5 text-center">
          <p className="text-4xl font-black uppercase text-white">WALLET REQUIRED</p>
          <p className="text-nb-muted max-w-md">
            Connect your Stellar wallet to create pools, stake XLM, submit proof, and settle.
          </p>
          <button
            type="button"
            onClick={connect}
            disabled={isConnecting}
            className="nb-btn-yellow disabled:opacity-50"
          >
            {isConnecting ? "CONNECTING…" : "CONNECT WALLET →"}
          </button>
        </div>
      </div>
    );
  }

  if (!CONTRACT_IDS.stakePool) {
    return (
      <div className="nb-card-orange p-6">
        <p className="font-black text-lg uppercase text-white mb-2">CONFIG MISSING</p>
        <p className="text-nb-muted text-sm">
          Set <code className="text-nb-orange">NEXT_PUBLIC_STAKE_POOL_ID</code> in{" "}
          <code className="text-nb-orange">.env.local</code> then restart.
        </p>
      </div>
    );
  }

  const deadlineDate = activePool
    ? new Date(Number(activePool.deadline) * 1000).toLocaleDateString(undefined, {
        month: "short", day: "numeric", year: "numeric",
      })
    : null;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-3 border-white pb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-nb-muted mb-2">
            CONNECTED: <span className="font-mono text-white">{publicKey.slice(0,6)}…{publicKey.slice(-4)}</span>
          </p>
          <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white">
            YOUR <span className="text-nb-green">POOLS</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="nb-btn-ghost text-xs self-start sm:self-auto disabled:opacity-40"
        >
          {loading ? "LOADING…" : "↺ REFRESH"}
        </button>
      </div>

      {loadError && (
        <div className="nb-card p-4" style={{ borderColor: "#FF3B3B", boxShadow: "4px 4px 0 #FF3B3B" }}>
          <p className="text-nb-red font-bold text-sm">{loadError}</p>
        </div>
      )}

      {/* Create pool */}
      <div className="nb-card-yellow p-5 sm:p-6 space-y-4">
        <p className="text-xs font-black uppercase tracking-widest text-nb-muted">CREATE NEW POOL</p>
        <p className="text-2xl font-black uppercase text-white">SET YOUR GOAL.</p>
        <CreatePoolForm onPoolCreated={refresh} />
      </div>

      {loading && (
        <div className="flex items-center gap-3">
          <span className="inline-block h-5 w-5 animate-spin rounded-full border-3 border-nb-yellow border-t-transparent" />
          <span className="text-nb-muted font-bold uppercase text-sm">LOADING POOLS…</span>
        </div>
      )}

      {!loading && pools.length === 0 && !loadError && (
        <div className="nb-card p-10 text-center">
          <p className="text-nb-muted font-black uppercase text-xl">NO POOLS YET</p>
          <p className="text-nb-muted text-sm mt-2">Use the form above to create the first one.</p>
        </div>
      )}

      {pools.length > 0 && (
        <>
          {/* Pool selector */}
          {pools.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-nb-muted py-2 w-full">
                SELECT POOL:
              </span>
              {pools.map((p) => (
                <button
                  key={p.pool_id.toString()}
                  type="button"
                  onClick={() => setSelectedPoolId(p.pool_id.toString())}
                  className={`text-xs font-black uppercase border-2 px-3 py-1.5 transition-all ${
                    selectedPoolId === p.pool_id.toString()
                      ? "bg-nb-yellow text-black border-nb-yellow"
                      : "border-white text-white hover:border-nb-yellow hover:text-nb-yellow"
                  }`}
                >
                  #{p.pool_id.toString()} {p.goal.slice(0, 20)}{p.goal.length > 20 ? "…" : ""}
                </button>
              ))}
            </div>
          )}

          {activePool && (
            <div className="space-y-4">
              {/* Pool header card */}
              <div className="nb-card-green p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono text-nb-muted">POOL #{activePool.pool_id.toString()}</span>
                    <p className="text-xl font-black text-white mt-1">{activePool.goal}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`nb-badge-${activePool.status === "Active" ? "yellow" : activePool.status === "Settling" ? "orange" : "green"}`}>
                      {activePool.status.toUpperCase()}
                    </span>
                    {deadlineDate && (
                      <p className="text-nb-muted text-xs mt-1">DEADLINE: {deadlineDate}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t-2 border-white/20 pt-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-nb-muted">STAKE</p>
                    <p className="font-black text-nb-green">
                      {(Number(activePool.stake_amount) / 1e7).toFixed(2)} XLM
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-nb-muted">THRESHOLD</p>
                    <p className="font-black text-nb-green">{activePool.threshold}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-nb-muted">MEMBERS</p>
                    <p className="font-black text-nb-green">{activePool.members.length}</p>
                  </div>
                </div>

                {/* Members list */}
                {activeMembers.length > 0 && (
                  <div className="border-t-2 border-white/20 pt-3 space-y-2">
                    <p className="text-xs font-black uppercase tracking-widest text-nb-muted">MEMBERS</p>
                    {activeMembers.map((m) => (
                      <div
                        key={m.address}
                        className="flex flex-wrap items-center gap-2 border border-white/20 px-3 py-2"
                      >
                        <span className="font-mono text-xs text-white">
                          {m.address.slice(0, 8)}…{m.address.slice(-4)}
                        </span>
                        {m.address === publicKey && (
                          <span className="text-nb-yellow text-xs font-bold">YOU</span>
                        )}
                        {m.staked  && <span className="text-nb-green text-xs font-bold">STAKED</span>}
                        {m.shipped && <span className="text-nb-yellow text-xs font-bold">SHIPPED</span>}
                        {m.ai_score != null && (
                          <span className="text-nb-green font-black text-xs">AI:{m.ai_score}</span>
                        )}
                        <span className="text-nb-muted text-xs">{m.peer_confirmations} PEERS</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <ActionSection title="STAKE XLM" accent="nb-card-yellow">
                  <p className="text-sm text-nb-muted">
                    Lock {(Number(activePool.stake_amount) / 1e7).toFixed(2)} XLM to join this pool.
                  </p>
                  <StakeForm poolId={activePool.pool_id} onSuccess={refresh} />
                </ActionSection>

                <ActionSection title="PROOF & AI SCORE" accent="nb-card-pink">
                  <p className="text-sm text-nb-muted">
                    Submit a link to your work — repo, demo, doc. AI will score it.
                  </p>
                  <SubmissionForm
                    poolId={activePool.pool_id}
                    goal={activePool.goal}
                    onSuccess={refresh}
                  />
                </ActionSection>

                <ActionSection title="PEER VOUCH" accent="nb-card-blue">
                  <p className="text-sm text-nb-muted">
                    Confirm another member shipped. Can&apos;t vouch for yourself.
                  </p>
                  <ConfirmPeerForm
                    poolId={activePool.pool_id}
                    memberAddresses={activePool.members}
                    onSuccess={refresh}
                  />
                </ActionSection>

                <ActionSection title="SETTLEMENT" accent="nb-card-orange">
                  <p className="text-sm text-nb-muted">
                    After deadline, trigger settlement to pay out and update reputation.
                  </p>
                  <SettlePoolButton
                    poolId={activePool.pool_id}
                    deadlineSec={activePool.deadline}
                    nowSec={nowSec}
                    status={activePool.status}
                    onSuccess={refresh}
                  />
                </ActionSection>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
