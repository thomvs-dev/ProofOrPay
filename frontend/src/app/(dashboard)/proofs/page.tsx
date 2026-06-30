"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useWallet } from "@/components/WalletConnect";
import { CONTRACT_IDS } from "@/lib/constants";
import { simulateTx, addressToScVal } from "@/lib/stellar";
import { ProofBadgeCard } from "@/components/ProofBadgeCard";
import { PageHeader } from "@/components/ui/PageHeader";
import { PoolCardSkeleton } from "@/components/ui/NbSkeleton";
import type { ProofBadgeView } from "@/types/pact";

function mapBadge(raw: unknown): ProofBadgeView {
  const b = raw as Record<string, unknown>;
  return {
    token_id: BigInt(String(b.token_id ?? 0)),
    pool_id: BigInt(String(b.pool_id ?? 0)),
    owner: String(b.owner ?? ""),
    proof_url: String(b.proof_url ?? ""),
    proof_cid: String(b.proof_cid ?? ""),
    image_cid: String(b.image_cid ?? ""),
    ai_score: Number(b.ai_score ?? 0),
    goal: String(b.goal ?? ""),
    minted_at: BigInt(String(b.minted_at ?? 0)),
  };
}

export default function ProofsPage() {
  const { publicKey } = useWallet();
  const [badges, setBadges] = useState<ProofBadgeView[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supply, setSupply] = useState<bigint | null>(null);

  const load = useCallback(async () => {
    if (!publicKey || !CONTRACT_IDS.proofBadge) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await simulateTx(
        CONTRACT_IDS.proofBadge,
        "get_badges_by_owner",
        [addressToScVal(publicKey)],
        publicKey,
      ) as unknown[];
      setBadges(raw.map(mapBadge));
      const total = await simulateTx(
        CONTRACT_IDS.proofBadge,
        "total_supply",
        [],
        publicKey,
      ) as number | string;
      setSupply(BigInt(String(total)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBadges([]);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-8 pb-16">
      <PageHeader
        eyebrow="Soulbound proof NFTs"
        title="Your proofs"
      >
        <button
          type="button"
          onClick={load}
          disabled={loading || !publicKey}
          className="nb-btn-ghost text-xs disabled:opacity-40"
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </PageHeader>

      {supply != null && (
        <p className="text-black/45 text-sm font-mono -mt-4">
          {supply.toString()} badges minted on-chain
        </p>
      )}

      {!CONTRACT_IDS.proofBadge && (
        <div className="nb-card p-6">
          <p className="font-medium text-black landing-font-heading">Proof badge contract not configured</p>
          <p className="text-black/55 text-sm mt-2">
            Set <code className="font-mono text-black/70">NEXT_PUBLIC_PROOF_BADGE_ID</code> after redeploying
            contracts with the proof_badge NFT.
          </p>
        </div>
      )}

      {!publicKey && (
        <div className="nb-card p-8 text-center space-y-3">
          <p className="text-xl font-medium text-black landing-font-heading">Connect wallet</p>
          <p className="text-black/55 text-sm">View proof NFTs minted when you ship.</p>
          <Link href="/app" className="nb-btn-yellow text-sm inline-flex">
            Go to app
          </Link>
        </div>
      )}

      {error && (
        <div className="nb-card p-4 border-red-200 bg-red-50">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PoolCardSkeleton />
          <PoolCardSkeleton />
          <PoolCardSkeleton />
        </div>
      )}

      {!loading && publicKey && badges.length === 0 && !error && (
        <div className="nb-card p-12 text-center space-y-4">
          <p className="text-4xl text-black/20">✳︎</p>
          <p className="text-xl font-medium text-black/55 landing-font-heading">No proof badges yet</p>
          <p className="text-black/45 text-sm max-w-md mx-auto">
            Submit proof with an IPFS image, pass AI + peer review, and settle the pool to mint
            your soulbound proof NFT.
          </p>
          <Link href="/app" className="nb-btn-yellow text-sm inline-flex">
            Start shipping
          </Link>
        </div>
      )}

      {!loading && badges.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {badges.map((b) => (
            <ProofBadgeCard key={b.token_id.toString()} badge={b} />
          ))}
        </div>
      )}
    </div>
  );
}
