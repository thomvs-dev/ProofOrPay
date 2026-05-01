"use client";

import type { PoolView, MemberView } from "@/types/pact";

function deadlineLabel(deadline: bigint): string {
  const sec = Number(deadline);
  if (!Number.isFinite(sec)) return "—";
  return new Date(sec * 1000).toLocaleString();
}

function secondsLeft(deadline: bigint, nowSec: number): string {
  const left = Number(deadline) - nowSec;
  if (left <= 0) return "ENDED";
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  return `${h}h ${m}m LEFT`;
}

export function PoolCard({
  pool,
  members,
  publicKey,
  nowSec,
}: {
  pool: PoolView;
  members: MemberView[];
  publicKey: string | null;
  nowSec: number;
}) {
  return (
    <article className="nb-card-yellow p-5 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <span className="text-xs font-mono text-nb-muted">POOL #{pool.pool_id.toString()}</span>
          <h2 className="text-xl font-black text-white mt-1">{pool.goal}</h2>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-nb-muted uppercase">DEADLINE</p>
          <p className="text-white text-sm font-mono">{deadlineLabel(pool.deadline)}</p>
          <p className="text-nb-yellow font-black text-sm mt-1">{secondsLeft(pool.deadline, nowSec)}</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 border-t-2 border-white/20 pt-3">
        <div>
          <p className="text-xs font-bold uppercase text-nb-muted">STAKE</p>
          <p className="font-black text-white font-mono">
            {(Number(pool.stake_amount) / 1e7).toFixed(2)} XLM
          </p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-nb-muted">AI THRESHOLD</p>
          <p className="font-black text-white">{pool.threshold}</p>
        </div>
        <div>
          <p className="text-xs font-bold uppercase text-nb-muted">STATUS</p>
          <p className="font-black text-nb-yellow uppercase">{pool.status}</p>
        </div>
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-nb-muted mb-2">MEMBERS</p>
        {members.length === 0 ? (
          <p className="text-nb-muted text-sm">No members yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {members.map((m) => (
              <li
                key={m.address}
                className="flex flex-wrap items-center gap-2 text-xs border border-white/20 px-3 py-2"
              >
                <span className="font-mono text-white">{m.address.slice(0, 8)}…</span>
                {m.address === publicKey && <span className="text-nb-yellow font-black">YOU</span>}
                {m.staked  && <span className="text-nb-green font-black">STAKED</span>}
                {m.shipped && <span className="text-nb-yellow font-black">SHIPPED</span>}
                {m.ai_score != null && <span className="text-nb-green">AI:{m.ai_score}</span>}
                <span className="text-nb-muted">{m.peer_confirmations} PEERS</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {publicKey &&
        pool.members.includes(publicKey) &&
        members.find((m) => m.address === publicKey && !m.staked) && (
          <p className="text-nb-orange font-black uppercase text-sm">⚡ STAKE NOW TO LOCK IN.</p>
        )}
    </article>
  );
}
