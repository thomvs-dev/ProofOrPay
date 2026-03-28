"use client";

import type { PoolView, MemberView } from "@/types/pact";

function deadlineLabel(deadline: bigint): string {
  const sec = Number(deadline);
  if (!Number.isFinite(sec)) return "—";
  const d = new Date(sec * 1000);
  return d.toLocaleString();
}

function secondsLeft(deadline: bigint, nowSec: number): string {
  const left = Number(deadline) - nowSec;
  if (left <= 0) return "Ended";
  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  return `${h}h ${m}m`;
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
    <article className="rounded-xl border border-stellar-border bg-stellar-card p-4 sm:p-5 space-y-3">
      <header className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-white">{pool.goal}</h2>
          <p className="text-xs text-gray-500 font-mono mt-1">Pool #{pool.pool_id.toString()}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-gray-400">Deadline</p>
          <p className="text-gray-200">{deadlineLabel(pool.deadline)}</p>
          <p className="text-amber-200/90 mt-1">{secondsLeft(pool.deadline, nowSec)}</p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 text-sm border-t border-stellar-border pt-3">
        <div>
          <span className="text-gray-500">Stake (each)</span>
          <p className="text-white font-mono">
            {(Number(pool.stake_amount) / 1e7).toFixed(2)} XLM
          </p>
        </div>
        <div>
          <span className="text-gray-500">AI threshold</span>
          <p className="text-white">{pool.threshold}</p>
        </div>
        <div>
          <span className="text-gray-500">Status</span>
          <p className="text-white">{pool.status}</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2">Members</h3>
        <ul className="space-y-2">
          {members.length === 0 && (
            <li className="text-gray-500 text-sm">No members yet.</li>
          )}
          {members.map((m) => (
            <li
              key={m.address}
              className="flex flex-wrap items-center gap-2 text-sm border border-stellar-border/60 rounded-lg px-3 py-2"
            >
              <span className="font-mono text-xs text-gray-300 truncate max-w-[200px]">
                {m.address.slice(0, 8)}…
              </span>
              <span className={m.staked ? "text-emerald-400" : "text-gray-500"}>
                {m.staked ? "staked ✓" : "not staked"}
              </span>
              {m.proof_url && (
                <span className="text-blue-300 text-xs truncate max-w-[120px]">
                  proof
                </span>
              )}
              {m.ai_score != null && (
                <span className="text-amber-200">AI {m.ai_score}</span>
              )}
              <span className="text-gray-400">peers {m.peer_confirmations}</span>
            </li>
          ))}
        </ul>
      </div>

      {publicKey &&
        pool.members.includes(publicKey) &&
        members.find((m) => m.address === publicKey && !m.staked) && (
          <p className="text-sm text-amber-200">Stake now to lock your commitment.</p>
        )}
    </article>
  );
}
