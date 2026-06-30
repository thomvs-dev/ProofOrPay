"use client";

import Link from "next/link";
import { IpfsImage } from "@/components/IpfsImage";
import { NbBadge } from "@/components/ui/NbBadge";
import { CONTRACT_IDS } from "@/lib/constants";
import type { ProofBadgeView } from "@/types/pact";

export function ProofBadgeCard({ badge }: { badge: ProofBadgeView }) {
  const imageCid = badge.image_cid || badge.proof_cid;
  const explorer = CONTRACT_IDS.proofBadge
    ? `https://stellar.expert/explorer/testnet/contract/${CONTRACT_IDS.proofBadge}`
    : null;

  return (
    <article className="group relative overflow-hidden nb-card transition-transform hover:-translate-y-0.5">
      <IpfsImage
        cid={imageCid}
        alt={badge.goal}
        className="aspect-[4/3] w-full border-b border-black/10"
        fallbackClassName="aspect-[4/3] w-full bg-gradient-to-br from-black/5 to-black/10"
      />

      <div className="relative p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <NbBadge variant="muted">Proof #{badge.token_id.toString()}</NbBadge>
          <span className="text-emerald-700 font-medium text-lg landing-font-heading">
            {badge.ai_score}
          </span>
        </div>

        <h3 className="font-medium text-black landing-font-heading leading-tight line-clamp-2">
          {badge.goal}
        </h3>

        <p className="text-xs text-black/45 font-mono">
          Pool #{badge.pool_id.toString()} ·{" "}
          {new Date(Number(badge.minted_at) * 1000).toLocaleDateString()}
        </p>

        <div className="flex flex-wrap gap-3 pt-1">
          {badge.proof_url && (
            <a
              href={badge.proof_url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-black underline underline-offset-2 hover:opacity-60"
            >
              View proof →
            </a>
          )}
          {explorer && (
            <Link
              href={explorer}
              target="_blank"
              className="text-xs text-black underline underline-offset-2 hover:opacity-60"
            >
              On-chain NFT →
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
