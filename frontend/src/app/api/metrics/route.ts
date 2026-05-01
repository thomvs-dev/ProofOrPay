import { NextResponse } from "next/server";
import { CONTRACT_IDS, NETWORK } from "@/lib/constants";
import { simulateTx } from "@/lib/stellar";

/**
 * Aggregated on-chain read metrics (simulation). Requires a funded testnet account
 * for simulation source (same constraint as the UI wallet path).
 */
export async function GET() {
  const pub =
    process.env.METRICS_SIMULATION_PUBLIC_KEY ?? process.env.VERIFY_PUBLIC_KEY;
  if (!pub || !CONTRACT_IDS.stakePool) {
    return NextResponse.json(
      {
        ok: false,
        configured: false,
        message:
          "Set NEXT_PUBLIC_STAKE_POOL_ID and METRICS_SIMULATION_PUBLIC_KEY (funded testnet G...) for server-side reads.",
        network: NETWORK.networkId,
      },
      { status: 503 },
    );
  }

  try {
    const rawPools = await simulateTx(
      CONTRACT_IDS.stakePool,
      "get_all_pools",
      [],
      pub,
    );
    const pools = rawPools as Record<string, unknown>[];
    let membersTotal = 0;
    const byPool: { id: string; members: number; status: string }[] = [];

    for (const p of pools) {
      const poolId = String(p.pool_id ?? "");
      const members = (p.members as string[] | undefined) ?? [];
      membersTotal += members.length;
      byPool.push({
        id: poolId,
        members: members.length,
        status: String(p.status ?? ""),
      });
    }

    let leaderboardLen = 0;
    if (CONTRACT_IDS.reputationLedger) {
      const lb = await simulateTx(
        CONTRACT_IDS.reputationLedger,
        "get_leaderboard",
        [],
        pub,
      );
      leaderboardLen = Array.isArray(lb) ? lb.length : 0;
    }

    return NextResponse.json({
      ok: true,
      configured: true,
      timestamp: new Date().toISOString(),
      network: NETWORK.networkId,
      pool_count: pools.length,
      members_total: membersTotal,
      leaderboard_entries: leaderboardLen,
      pools: byPool,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        error: message,
        network: NETWORK.networkId,
      },
      { status: 502 },
    );
  }
}
