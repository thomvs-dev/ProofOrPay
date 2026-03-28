import {
  Address,
  Contract,
  Keypair,
  nativeToScVal,
  scValToNative,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { Api, Server, assembleTransaction } from "@stellar/stellar-sdk/rpc";
import { CONTRACT_IDS, NETWORK, BASE_FEE, TX_TIMEOUT_SEC } from "./constants";

export const server = new Server(NETWORK.rpcUrl, { allowHttp: false });

export const SendTxStatus = {
  Pending: "PENDING",
  Duplicate: "DUPLICATE",
  Retry: "TRY_AGAIN_LATER",
  Error: "ERROR",
} as const;

function jsonForError(value: unknown): string {
  try {
    return JSON.stringify(value, (_, v) =>
      typeof v === "bigint" ? v.toString() : v,
    );
  } catch {
    return String(value);
  }
}

export async function getTxBuilder(pubKey: string) {
  const source = await server.getAccount(pubKey);
  return new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK.passphrase,
  });
}

export async function simulateTx<T>(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  pubKey: string,
): Promise<T> {
  const txBuilder = await getTxBuilder(pubKey);
  const contract = new Contract(contractId);
  const tx = txBuilder
    .addOperation(contract.call(method, ...args))
    .setTimeout(TX_TIMEOUT_SEC)
    .build();

  const response = await server.simulateTransaction(tx);
  if (!Api.isSimulationSuccess(response) || !response.result) {
    throw new Error(`simulation failed: ${jsonForError(response)}`);
  }
  return scValToNative(response.result.retval) as T;
}

export async function buildAndSubmitTx(
  contractId: string,
  method: string,
  args: xdr.ScVal[],
  pubKey: string,
  signTransaction: (xdr: string) => Promise<string>,
): Promise<string> {
  const txBuilder = await getTxBuilder(pubKey);
  const contract = new Contract(contractId);
  const tx = txBuilder
    .addOperation(contract.call(method, ...args))
    .setTimeout(TX_TIMEOUT_SEC)
    .build();

  const simResponse = await server.simulateTransaction(tx);
  if (!Api.isSimulationSuccess(simResponse)) {
    throw new Error(`simulation failed: ${jsonForError(simResponse)}`);
  }

  const prepared = assembleTransaction(tx, simResponse).build();
  const signedXdr = await signTransaction(prepared.toXDR());

  return submitTx(signedXdr);
}

export async function submitTx(signedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK.passphrase);
  const sendResponse = await server.sendTransaction(tx);

  if (sendResponse.errorResult) {
    throw new Error("Unable to submit transaction");
  }

  if (sendResponse.status === SendTxStatus.Pending) {
    let txResponse = await server.getTransaction(sendResponse.hash);
    let attempts = 0;

    while (
      txResponse.status === Api.GetTransactionStatus.NOT_FOUND &&
      attempts < 30
    ) {
      await new Promise((r) => setTimeout(r, 1000));
      txResponse = await server.getTransaction(sendResponse.hash);
      attempts++;
    }

    if (txResponse.status === Api.GetTransactionStatus.SUCCESS) {
      return sendResponse.hash;
    }

    throw new Error(`Transaction failed with status: ${txResponse.status}`);
  }

  throw new Error(`Unexpected send status: ${sendResponse.status}`);
}

/** Server-side: submit `record_ai_verdict` as the configured verifier key. */
export async function submitRecordAiVerdict(
  poolId: bigint,
  memberAddress: string,
  score: number,
): Promise<string | null> {
  const secret = process.env.STELLAR_VERIFIER_SECRET_KEY;
  const contractId = CONTRACT_IDS.stakePool;
  if (!secret || !contractId) {
    return null;
  }

  const kp = Keypair.fromSecret(secret);
  const source = await server.getAccount(kp.publicKey());
  const contract = new Contract(contractId);
  const pool = nativeToScVal(poolId, { type: "u64" });
  const member = new Address(memberAddress).toScVal();
  const sc = nativeToScVal(score, { type: "u32" });

  const tx = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK.passphrase,
  })
    .addOperation(
      contract.call("record_ai_verdict", pool, member, sc),
    )
    .setTimeout(TX_TIMEOUT_SEC)
    .build();

  const sim = await server.simulateTransaction(tx);
  if (!Api.isSimulationSuccess(sim)) {
    throw new Error(`simulation failed: ${jsonForError(sim)}`);
  }

  const built = assembleTransaction(tx, sim).build();
  built.sign(kp);
  return submitTx(built.toXDR());
}

export const addressToScVal = (addr: string) => new Address(addr).toScVal();
export const u64ToScVal = (val: bigint) => nativeToScVal(val, { type: "u64" });
export const i128ToScVal = (val: bigint) => nativeToScVal(val, { type: "i128" });
export const u32ToScVal = (val: number) => nativeToScVal(val, { type: "u32" });
export const stringToScVal = (val: string) =>
  nativeToScVal(val, { type: "string" });
export const xlmToStroops = (xlm: number): bigint =>
  BigInt(Math.round(xlm * 10_000_000));
