/** IPFS gateway helpers for ProofOrPay pool covers and proof badges. */

const GATEWAY =
  process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://ipfs.io/ipfs/";

const CID_RE = /^(Qm[1-9A-HJ-NP-Za-km-z]{44,}|bafy[a-z0-9]{50,}|bafkrei[a-z0-9]{50,})$/i;

export function isValidCid(cid: string): boolean {
  const t = cid.trim();
  return t.length > 0 && CID_RE.test(t);
}

export function ipfsGatewayUrl(cid: string | null | undefined): string | null {
  if (!cid?.trim()) return null;
  const clean = cid.trim().replace(/^ipfs:\/\//, "");
  return `${GATEWAY}${clean}`;
}

export function ipfsUri(cid: string): string {
  return `ipfs://${cid.trim().replace(/^ipfs:\/\//, "")}`;
}

export async function uploadToIpfs(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/ipfs/upload", { method: "POST", body: form });
  const data = (await res.json()) as { cid?: string; error?: string };
  if (!res.ok || !data.cid) {
    throw new Error(data.error ?? "IPFS upload failed");
  }
  return data.cid;
}

export function readOptionalString(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length > 0 ? s : null;
}
