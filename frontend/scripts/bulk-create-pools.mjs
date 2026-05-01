#!/usr/bin/env node
import {
  Contract,
  Keypair,
  TransactionBuilder,
  Address,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import { Server, Api, assembleTransaction } from "@stellar/stellar-sdk/rpc";

const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const PASSPHRASE = process.env.STELLAR_NETWORK_PASSPHRASE ?? "Test SDF Network ; September 2015";
const STAKE_POOL_ID = process.env.NEXT_PUBLIC_STAKE_POOL_ID ?? "CCTG6HGQJFCOVK6VVU4SA46KIHQU5Q6QMSJ3WVOXHGZRYXOMANVWTLLW";

const NAMES = ["anees", "farseen", "zamaan", "soumil", "ashank", "dauoo", "prashil"];
const server = new Server(RPC_URL, { allowHttp: false });

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fundAccount(pubkey) {
  console.log(`Funding ${pubkey} via Friendbot...`);
  const fb = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(pubkey)}`);
  if (!fb.ok) {
    throw new Error(`Friendbot failed: ${fb.status} ${await fb.text()}`);
  }
  
  const horizon = "https://horizon-testnet.stellar.org";
  for (let i = 0; i < 20; i++) {
    const check = await fetch(`${horizon}/accounts/${pubkey}`);
    if (check.ok) return;
    await sleep(1000);
  }
  throw new Error("Account not funded in time");
}

async function createPool(kp, name) {
  console.log(`Creating pool for ${name} (${kp.publicKey()})...`);
  
  const sourceAccount = await server.getAccount(kp.publicKey());
  const contract = new Contract(STAKE_POOL_ID);
  
  const goal = `Mastering Soroban: ${name}'s decentralized vision`;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400 * 7); // 7 days from now
  const stakeAmount = 10000000n; // 1 XLM in stroops (7 decimals)
  const threshold = 60;

  const tx = new TransactionBuilder(sourceAccount, {
    fee: "100000", // High fee for testnet reliability
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(
      contract.call(
        "create_pool",
        new Address(kp.publicKey()).toScVal(),
        nativeToScVal(goal, { type: "string" }),
        nativeToScVal(deadline, { type: "u64" }),
        nativeToScVal(stakeAmount, { type: "i128" }),
        nativeToScVal(threshold, { type: "u32" })
      )
    )
    .setTimeout(30)
    .build();

  // Simulate to get resource footprint
  const simulation = await server.simulateTransaction(tx);
  if (!Api.isSimulationSuccess(simulation)) {
    throw new Error(`Simulation failed for ${name}: ${JSON.stringify(simulation)}`);
  }

  const assembledTx = assembleTransaction(tx, simulation).build();
  assembledTx.sign(kp);

  const sendResponse = await server.sendTransaction(assembledTx);
  if (sendResponse.status !== "PENDING") {
    throw new Error(`Send failed for ${name}: ${JSON.stringify(sendResponse)}`);
  }

  let response = await server.getTransaction(sendResponse.hash);
  while (response.status === "NOT_FOUND" || response.status === "PENDING") {
    await sleep(2000);
    response = await server.getTransaction(sendResponse.hash);
  }

  if (response.status === "SUCCESS") {
    const poolId = scValToNative(response.returnValue);
    console.log(`Pool created for ${name}! ID: ${poolId}`);
    return poolId;
  } else {
    throw new Error(`Transaction failed for ${name}: ${JSON.stringify(response)}`);
  }
}

async function main() {
  const results = [];
  const walletMap = {};

  for (const name of NAMES) {
    const kp = Keypair.random();
    try {
      await fundAccount(kp.publicKey());
      const poolId = await createPool(kp, name);
      results.push({
        name,
        address: kp.publicKey(),
        secret: kp.secret(),
        poolId: poolId.toString()
      });
      walletMap[name] = kp.publicKey();
    } catch (err) {
      console.error(`Failed to process ${name}:`, err.message);
    }
  }

  console.log("\n--- WALLET MAPPING ---");
  console.log(JSON.stringify(walletMap, null, 2));

  console.log("\n--- FULL DETAILS ---");
  console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error);
