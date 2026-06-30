"use client";

import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useWallet } from "@/components/WalletConnect";
import { CONTRACT_IDS } from "@/lib/constants";
import { simulateTx, addressToScVal, u64ToScVal } from "@/lib/stellar";
import { readOptionalString } from "@/lib/ipfs";
import { CreatePoolForm } from "@/components/CreatePoolForm";
import { PoolCardSkeleton } from "@/components/ui/NbSkeleton";
import { StakeForm } from "@/components/StakeForm";
import { SubmissionForm } from "@/components/SubmissionForm";
import { ConfirmPeerForm } from "@/components/ConfirmPeerForm";
import { SettlePoolButton } from "@/components/SettlePoolButton";
import { FilterChip, PageHeader } from "@/components/ui/PageHeader";
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
    cover_cid: readOptionalString(p.cover_cid),
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

function ActionSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="nb-card p-5 space-y-3">
      <p className="text-sm text-black/45">{title}</p>
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
        <PageHeader eyebrow="ProofOrPay" title="Launch app" />
        <div className="nb-card p-10 flex flex-col items-center gap-5 text-center">
          <p className="text-2xl font-medium text-black landing-font-heading">Wallet required</p>
          <p className="text-black/55 max-w-md text-sm">
            Connect your Stellar wallet to create pools, stake XLM, submit proof, and settle.
          </p>
          <button
            type="button"
            onClick={connect}
            disabled={isConnecting}
            className="nb-btn-yellow disabled:opacity-50"
          >
            {isConnecting ? "Connecting…" : "Connect wallet"}
          </button>
        </div>
      </div>
    );
  }

  if (!CONTRACT_IDS.stakePool) {
    return (
      <div className="nb-card p-6">
        <p className="font-medium text-lg text-black mb-2 landing-font-heading">Config missing</p>
        <p className="text-black/55 text-sm">
          Set <code className="font-mono text-black/70">NEXT_PUBLIC_STAKE_POOL_ID</code> in{" "}
          <code className="font-mono text-black/70">.env.local</code> then restart.
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
      <PageHeader
        eyebrow={`Connected: ${publicKey.slice(0, 6)}…${publicKey.slice(-4)}`}
        title="Your pools"
      >
        <button
          type="button"
          onClick={refresh}
          disabled={loading}
          className="nb-btn-ghost text-xs self-start sm:self-auto disabled:opacity-40"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </PageHeader>

      {loadError && (
        <div className="nb-card p-4 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm">{loadError}</p>
        </div>
      )}

      <div className="nb-card p-5 sm:p-6 space-y-4">
        <p className="text-sm text-black/45">Create new pool</p>
        <p className="text-xl font-medium text-black landing-font-heading">Set your goal</p>
        <CreatePoolForm onPoolCreated={refresh} />
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          <PoolCardSkeleton />
          <PoolCardSkeleton />
        </div>
      )}

      {!loading && pools.length === 0 && !loadError && (
        <div className="nb-card p-10 text-center">
          <p className="text-black/55 font-medium text-xl landing-font-heading">No pools yet</p>
          <p className="text-black/45 text-sm mt-2">Use the form above to create the first one.</p>
        </div>
      )}

      {pools.length > 0 && (
        <>
          {pools.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-black/45 py-2 w-full">Select pool</span>
              {pools.map((p) => (
                <FilterChip
                  key={p.pool_id.toString()}
                  active={selectedPoolId === p.pool_id.toString()}
                  onClick={() => setSelectedPoolId(p.pool_id.toString())}
                >
                  #{p.pool_id.toString()} {p.goal.slice(0, 20)}{p.goal.length > 20 ? "…" : ""}
                </FilterChip>
              ))}
            </div>
          )}

          {activePool && (
            <div className="space-y-4">
              <div className="nb-card p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-mono text-black/45">Pool #{activePool.pool_id.toString()}</span>
                    <p className="text-xl font-medium text-black mt-1 landing-font-heading">{activePool.goal}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`nb-badge-${activePool.status === "Active" ? "yellow" : activePool.status === "Settling" ? "orange" : "green"}`}>
                      {activePool.status}
                    </span>
                    {deadlineDate && (
                      <p className="text-black/45 text-xs mt-1">Deadline: {deadlineDate}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 border-t border-black/10 pt-3">
                  <div>
                    <p className="text-xs text-black/45">Stake</p>
                    <p className="font-medium text-black">
                      {(Number(activePool.stake_amount) / 1e7).toFixed(2)} XLM
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-black/45">Threshold</p>
                    <p className="font-medium text-black">{activePool.threshold}</p>
                  </div>
                  <div>
                    <p className="text-xs text-black/45">Members</p>
                    <p className="font-medium text-black">{activePool.members.length}</p>
                  </div>
                </div>

                {activeMembers.length > 0 && (
                  <div className="border-t border-black/10 pt-3 space-y-2">
                    <p className="text-xs text-black/45">Members</p>
                    {activeMembers.map((m) => (
                      <div
                        key={m.address}
                        className="flex flex-wrap items-center gap-2 border border-black/10 rounded-lg px-3 py-2"
                      >
                        <span className="font-mono text-xs text-black">
                          {m.address.slice(0, 8)}…{m.address.slice(-4)}
                        </span>
                        {m.address === publicKey && (
                          <span className="nb-badge text-[10px]">You</span>
                        )}
                        {m.staked && <span className="nb-badge-green text-[10px]">Staked</span>}
                        {m.shipped && <span className="nb-badge text-[10px]">Shipped</span>}
                        {m.ai_score != null && (
                          <span className="text-emerald-700 text-xs">AI: {m.ai_score}</span>
                        )}
                        <span className="text-black/45 text-xs">{m.peer_confirmations} peers</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <ActionSection title="Stake XLM">
                  <p className="text-sm text-black/55">
                    Lock {(Number(activePool.stake_amount) / 1e7).toFixed(2)} XLM to join this pool.
                  </p>
                  <StakeForm poolId={activePool.pool_id} onSuccess={refresh} />
                </ActionSection>

                <ActionSection title="Proof & AI score">
                  <p className="text-sm text-black/55">
                    Submit a link to your work — repo, demo, doc. AI will score it.
                  </p>
                  <SubmissionForm
                    poolId={activePool.pool_id}
                    goal={activePool.goal}
                    onSuccess={refresh}
                  />
                </ActionSection>

                <ActionSection title="Peer vouch">
                  <p className="text-sm text-black/55">
                    Confirm another member shipped. Can&apos;t vouch for yourself.
                  </p>
                  <ConfirmPeerForm
                    poolId={activePool.pool_id}
                    memberAddresses={activePool.members}
                    onSuccess={refresh}
                  />
                </ActionSection>

                <ActionSection title="Settlement">
                  <p className="text-sm text-black/55">
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
