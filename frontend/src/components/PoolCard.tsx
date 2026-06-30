"use client";

import type { PoolView, MemberView } from "@/types/pact";

function deadlineLabel(deadline: bigint): string {
  const sec = Number(deadline);
  if (!Number.isFinite(sec)) return "—";
  return new Date(sec * 1000).toLocaleString();
}

function secondsLeft(deadline: bigint, nowSec: number): string {
  const left = Number(deadline) - nowSec;
  if (left <= 0) return "Ended";
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  return `${h}h ${m}m left`;
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
    <article className="nb-card p-5 space-y-4">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div>
          <span className="text-xs font-mono text-black/45">Pool #{pool.pool_id.toString()}</span>
          <h2 className="text-xl font-medium text-black mt-1 landing-font-heading">{pool.goal}</h2>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-black/45">Deadline</p>
          <p className="text-black text-sm font-mono">{deadlineLabel(pool.deadline)}</p>
          <p className="text-black/70 font-medium text-sm mt-1">{secondsLeft(pool.deadline, nowSec)}</p>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 border-t border-black/10 pt-3">
        <div>
          <p className="text-xs text-black/45">Stake</p>
          <p className="font-medium text-black font-mono">
            {(Number(pool.stake_amount) / 1e7).toFixed(2)} XLM
          </p>
        </div>
        <div>
          <p className="text-xs text-black/45">AI threshold</p>
          <p className="font-medium text-black">{pool.threshold}</p>
        </div>
        <div>
          <p className="text-xs text-black/45">Status</p>
          <p className="font-medium text-black">{pool.status}</p>
        </div>
      </div>

      <div>
        <p className="text-xs text-black/45 mb-2">Members</p>
        {members.length === 0 ? (
          <p className="text-black/45 text-sm">No members yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {members.map((m) => (
              <li
                key={m.address}
                className="flex flex-wrap items-center gap-2 text-xs border border-black/10 rounded-lg px-3 py-2"
              >
                <span className="font-mono text-black">{m.address.slice(0, 8)}…</span>
                {m.address === publicKey && <span className="nb-badge text-[10px]">You</span>}
                {m.staked && <span className="nb-badge-green text-[10px]">Staked</span>}
                {m.shipped && <span className="nb-badge text-[10px]">Shipped</span>}
                {m.ai_score != null && <span className="text-emerald-700">AI: {m.ai_score}</span>}
                <span className="text-black/45">{m.peer_confirmations} peers</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {publicKey &&
        pool.members.includes(publicKey) &&
        members.find((m) => m.address === publicKey && !m.staked) && (
          <p className="text-black/55 text-sm">Stake now to lock in.</p>
        )}
    </article>
  );
}
