#!/usr/bin/env node
/**
 * Testnet verification: simulates read-only contract calls and prints a JSON report.
 * Funds a one-off testnet account via Friendbot if VERIFY_PUBLIC_KEY is not set.
 *
 * Usage (from repo):
 *   cd frontend && npm run verify:testnet
 *
 * Env:
 *   SOROBAN_RPC_URL (default: soroban-testnet)
 *   STELLAR_NETWORK_PASSPHRASE (default: testnet)
 *   STAKE_POOL_ID / NEXT_PUBLIC_STAKE_POOL_ID
 *   REPUTATION_LEDGER_ID / NEXT_PUBLIC_REPUTATION_LEDGER_ID
 *   VERIFY_PUBLIC_KEY — optional G... (must exist on testnet if set)
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Contract,
  Keypair,
  TransactionBuilder,
  Address,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import { Server, Api } from "@stellar/stellar-sdk/rpc";

const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const PASSPHRASE =
  process.env.STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";
const BASE_FEE = "100";
const TIMEOUT = 30;

const STAKE_POOL =
  process.env.STAKE_POOL_ID ??
  process.env.NEXT_PUBLIC_STAKE_POOL_ID ??
  "CCTG6HGQJFCOVK6VVU4SA46KIHQU5Q6QMSJ3WVOXHGZRYXOMANVWTLLW";
const REP_LEDGER =
  process.env.REPUTATION_LEDGER_ID ??
  process.env.NEXT_PUBLIC_REPUTATION_LEDGER_ID ??
  "CBANPWSJ4BDAK46WC3VVB6RRV4TUHCXLWALHYOUGTNBZA3J25SKA7DCE";

const server = new Server(RPC_URL, { allowHttp: false });

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fundIfNeeded(pubkey) {
  const horizon = "https://horizon-testnet.stellar.org";
  const r = await fetch(`${horizon}/accounts/${pubkey}`);
  if (r.ok) return;
  const fb = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(pubkey)}`);
  if (!fb.ok) {
    throw new Error(`Friendbot failed: ${fb.status} ${await fb.text()}`);
  }
  for (let i = 0; i < 20; i++) {
    const check = await fetch(`${horizon}/accounts/${pubkey}`);
    if (check.ok) return;
    await sleep(500);
  }
  throw new Error("Account not funded in time");
}

async function getBuilder(pubKey) {
  const source = await server.getAccount(pubKey);
  return new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: PASSPHRASE,
  });
}

async function simulate(contractId, method, args, pubKey) {
  const txBuilder = await getBuilder(pubKey);
  const contract = new Contract(contractId);
  const tx = txBuilder
    .addOperation(contract.call(method, ...args))
    .setTimeout(TIMEOUT)
    .build();
  const response = await server.simulateTransaction(tx);
  if (!Api.isSimulationSuccess(response) || !response.result) {
    return { ok: false, error: JSON.stringify(response) };
  }
  try {
    const val = scValToNative(response.result.retval);
    return { ok: true, result: val };
  } catch (e) {
    return { ok: true, result: String(e) };
  }
}

function jsonStringifySafe(value) {
  return JSON.stringify(
    value,
    (_, v) => (typeof v === "bigint" ? v.toString() : v),
    2,
  );
}

async function main() {
  let pub;
  if (process.env.VERIFY_PUBLIC_KEY) {
    pub = process.env.VERIFY_PUBLIC_KEY;
    await fundIfNeeded(pub);
  } else {
    const kp = Keypair.random();
    await fundIfNeeded(kp.publicKey());
    pub = kp.publicKey();
  }

  const memberScVal = new Address(pub).toScVal();
  const report = {
    timestamp: new Date().toISOString(),
    network: "testnet",
    rpc_url: RPC_URL,
    simulation_account: pub,
    contracts: { stake_pool: STAKE_POOL, reputation_ledger: REP_LEDGER },
    checks: [],
  };

  async function add(name, fn) {
    const r = await fn();
    report.checks.push({ name, ...r });
  }

  await add("stake_pool.get_all_pools", () =>
    simulate(STAKE_POOL, "get_all_pools", [], pub),
  );

  const poolsCheck = report.checks[report.checks.length - 1];
  let poolIdForRead = 0n;
  let memberForRead = pub;
  if (
    poolsCheck.ok &&
    Array.isArray(poolsCheck.result) &&
    poolsCheck.result.length > 0
  ) {
    const p0 = poolsCheck.result[0];
    poolIdForRead = BigInt(String(p0.pool_id ?? 0));
    const members = p0.members;
    if (Array.isArray(members) && members.length > 0) {
      memberForRead = String(members[0]);
    } else if (p0.creator) {
      memberForRead = String(p0.creator);
    }
  }

  const memberScValRead = new Address(memberForRead).toScVal();

  const hasPools =
    poolsCheck.ok &&
    Array.isArray(poolsCheck.result) &&
    poolsCheck.result.length > 0;

  if (hasPools) {
    await add(`stake_pool.get_pool(${poolIdForRead})`, () =>
      simulate(STAKE_POOL, "get_pool", [nativeToScVal(poolIdForRead, { type: "u64" })], pub),
    );
  } else {
    report.checks.push({
      name: "stake_pool.get_pool",
      ok: true,
      skipped: true,
      note: "No pools on chain; skipped (would panic for missing id). Create a pool and re-run.",
    });
  }

  await add(`stake_pool.get_member(${poolIdForRead},member)`, () =>
    simulate(STAKE_POOL, "get_member", [
      nativeToScVal(poolIdForRead, { type: "u64" }),
      memberScValRead,
    ], pub),
  );
  await add("reputation_ledger.get_leaderboard", () =>
    simulate(REP_LEDGER, "get_leaderboard", [], pub),
  );
  await add("reputation_ledger.get_reputation(member)", () =>
    simulate(REP_LEDGER, "get_reputation", [memberScValRead], pub),
  );

  const passed = report.checks.filter((c) => c.ok).length;
  const failed = report.checks.filter((c) => !c.ok && !c.skipped).length;
  report.summary = { passed, failed, total: report.checks.length };

  const outPath = process.argv.find((a) => a.startsWith("--write="));
  if (outPath) {
    const file = outPath.slice("--write=".length);
    writeFileSync(resolve(file), jsonStringifySafe(report));
    console.error(`Wrote ${file}`);
  }

  console.log(jsonStringifySafe(report));
  if (failed > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
