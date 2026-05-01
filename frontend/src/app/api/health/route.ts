import { NextResponse } from "next/server";
import { NETWORK } from "@/lib/constants";

/**
 * Liveness for operators: app + Soroban RPC reachability (HEAD on Sororan RPC).
 */
export async function GET() {
  let rpcOk = false;
  try {
    const r = await fetch(NETWORK.rpcUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    rpcOk = r.ok || r.status === 405;
  } catch {
    rpcOk = false;
  }

  const body = {
    ok: true,
    service: "onchain-account",
    timestamp: new Date().toISOString(),
    network: NETWORK.networkId,
    soroban_rpc: NETWORK.rpcUrl,
    soroban_rpc_reachable: rpcOk,
  };

  return NextResponse.json(body);
}
