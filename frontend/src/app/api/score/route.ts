import { NextResponse } from "next/server";
import {
  buildScorePrompt,
  fetchGithubMeta,
  parseScoreFromAnthropicJson,
} from "@/lib/ai-verifier";
import { submitRecordAiVerdict } from "@/lib/stellar";

export async function POST(req: Request) {
  let body: {
    pool_id?: string;
    member_address?: string;
    proof_url?: string;
    goal?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const pool_id = body.pool_id ?? "";
  const member_address = body.member_address ?? "";
  const proof_url = body.proof_url ?? "";
  const goal = body.goal ?? "";

  if (!proof_url || !goal || !member_address) {
    return NextResponse.json(
      { error: "proof_url, goal, and member_address required" },
      { status: 400 },
    );
  }

  const repoData = await fetchGithubMeta(proof_url);
  const prompt = buildScorePrompt(proof_url, goal, repoData);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  let score: number;
  let breakdown: Record<string, unknown> = {};

  if (!apiKey) {
    score = 72;
    breakdown = { mock: true, note: "Set ANTHROPIC_API_KEY for real Claude scoring" };
  } else {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Claude API error: ${errText}` },
        { status: 502 },
      );
    }

    const anthropicJson = await response.json();
    try {
      const parsed = parseScoreFromAnthropicJson(anthropicJson);
      score = Math.min(100, Math.max(0, Math.round(parsed.score)));
      breakdown = parsed.breakdown ?? {};
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "parse score failed" },
        { status: 502 },
      );
    }
  }

  const poolIdBn = BigInt(pool_id || "0");
  let onchainTx: string | null = null;
  try {
    onchainTx = await submitRecordAiVerdict(poolIdBn, member_address, score);
  } catch {
    onchainTx = null;
  }

  return NextResponse.json({ score, breakdown, onchainTx });
}
