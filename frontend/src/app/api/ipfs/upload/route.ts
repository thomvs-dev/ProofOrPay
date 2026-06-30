import { NextResponse } from "next/server";
import { createHash } from "node:crypto";

/**
 * Pins file to IPFS via Pinata when PINATA_JWT is set.
 * Otherwise returns a deterministic demo CID (testnet-only; not globally pinned).
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const pinataJwt = process.env.PINATA_JWT;

    if (pinataJwt) {
      const body = new FormData();
      body.append("file", new Blob([buffer]), (file as File).name || "upload.bin");
      const pinRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: { Authorization: `Bearer ${pinataJwt}` },
        body,
      });
      const pinData = (await pinRes.json()) as { IpfsHash?: string; error?: string };
      if (!pinRes.ok || !pinData.IpfsHash) {
        return NextResponse.json(
          { error: pinData.error ?? "Pinata upload failed" },
          { status: 502 },
        );
      }
      return NextResponse.json({ cid: pinData.IpfsHash, pinned: true });
    }

    // Demo/testnet fallback: deterministic hash-based placeholder CID
    const hash = createHash("sha256").update(buffer).digest("hex");
    const demoCid = `bafkreidemo${hash.slice(0, 52)}`;
    return NextResponse.json({
      cid: demoCid,
      pinned: false,
      note: "Set PINATA_JWT for real IPFS pinning. Demo CID stored on-chain only.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
