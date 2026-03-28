"use client";

import { useEffect, useState } from "react";
import { PoolCard } from "@/components/PoolCard";
import { StakeForm } from "@/components/StakeForm";
import { SubmissionForm } from "@/components/SubmissionForm";
import { useWallet } from "@/components/WalletConnect";
import { CONTRACT_IDS } from "@/lib/constants";
import { simulateTx, addressToScVal, u64ToScVal } from "@/lib/stellar";
import type { MemberView, PoolView } from "@/types/pact";

function mapPool(raw: unknown): PoolView {
  const p = raw as Record<string, unknown>;
  return {
    pool_id: BigInt(String(p.pool_id ?? 0)),
    creator: String(p.creator ?? ""),
    goal: String(p.goal ?? ""),
    deadline: BigInt(String(p.deadline ?? 0)),
    stake_amount: BigInt(String(p.stake_amount ?? 0)),
    members: (p.members as string[]) ?? [],
    status: String(p.status ?? "Active") as PoolView["status"],
    threshold: Number(p.threshold ?? 60),
  };
}

export default function HomePage() {
  const { publicKey } = useWallet();
  const [pools, setPools] = useState<PoolView[]>([]);
  const [membersByPool, setMembersByPool] = useState<Record<string, MemberView[]>>(
    {},
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const t = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!CONTRACT_IDS.stakePool || !publicKey) {
      setPools([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const raw = await simulateTx(
          CONTRACT_IDS.stakePool,
          "get_all_pools",
          [],
          publicKey,
        );
        const list = raw as unknown[];
        if (cancelled) return;
        const mapped = list.map(mapPool);
        setPools(mapped);
        setLoadError(null);

        const nextMembers: Record<string, MemberView[]> = {};
        for (const pool of mapped) {
          const key = pool.pool_id.toString();
          nextMembers[key] = [];
          for (const addr of pool.members) {
            try {
              const m = await simulateTx(
                CONTRACT_IDS.stakePool,
                "get_member",
                [u64ToScVal(pool.pool_id), addressToScVal(addr)],
                publicKey,
              );
              const r = m as Record<string, unknown>;
              nextMembers[key].push({
                address: addr,
                staked: Boolean(r.staked),
                proof_url: r.proof_url != null ? String(r.proof_url) : null,
                ai_score:
                  r.ai_score != null ? Number(r.ai_score) : null,
                peer_confirmations: Number(r.peer_confirmations ?? 0),
                shipped: Boolean(r.shipped),
              });
            } catch {
              /* skip */
            }
          }
        }
        if (!cancelled) setMembersByPool(nextMembers);
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : String(e));
          setPools([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  const activePool = pools.length > 0 ? pools[0] : null;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">
          Stake your word. Ship or lose.
        </h1>
        <p className="text-gray-400 max-w-2xl text-sm sm:text-base">
          Pact Protocol (on-chain account): small groups stake XLM on shipping goals by a
          deadline. Proofs are scored off-chain; results are recorded on Soroban. See{" "}
          <code className="text-gray-500">pact_protocol_spec.md</code> in the repo root.
        </p>
      </header>

      {!CONTRACT_IDS.stakePool && (
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-4 text-amber-100 text-sm">
          Set <code className="text-amber-200">NEXT_PUBLIC_STAKE_POOL_ID</code> in{" "}
          <code>.env.local</code> after deploying contracts.
        </div>
      )}

      {loadError && (
        <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-3 text-red-200 text-sm">
          {loadError}
        </div>
      )}

      {CONTRACT_IDS.stakePool && publicKey && pools.length === 0 && !loadError && (
        <p className="text-gray-400 text-sm">
          No pools on this contract yet. Create one with{" "}
          <code className="text-gray-500">create_pool</code> (see{" "}
          <code className="text-gray-500">scripts/invoke-test.sh</code>).
        </p>
      )}

      {activePool && (
        <>
          <PoolCard
            pool={activePool}
            members={membersByPool[activePool.pool_id.toString()] ?? []}
            publicKey={publicKey}
            nowSec={nowSec}
          />
          <section className="grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Stake</h2>
              <StakeForm poolId={activePool.pool_id} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Submit proof</h2>
              <SubmissionForm poolId={activePool.pool_id} goal={activePool.goal} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
