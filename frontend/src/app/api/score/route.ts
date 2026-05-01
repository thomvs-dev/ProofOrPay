import { NextResponse } from "next/server";
import {
  buildScorePrompt,
  fetchGithubMeta,
  parseScoreFromAnthropicJson,
  parseScoreFromGeminiJson,
} from "@/lib/ai-verifier";
import { submitRecordAiVerdict } from "@/lib/stellar";

const GEMINI_MODEL_DEFAULT = "gemini-2.0-flash";

async function scoreWithGemini(
  prompt: string,
  apiKey: string,
): Promise<{ score: number; breakdown: Record<string, unknown> }> {
  const model = process.env.GEMINI_MODEL ?? GEMINI_MODEL_DEFAULT;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 512,
        temperature: 0.2,
      },
    }),
  });
  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${errText}`);
  }
  const json = await response.json();
  const parsed = parseScoreFromGeminiJson(json);
  return {
    score: Math.min(100, Math.max(0, Math.round(parsed.score))),
    breakdown: parsed.breakdown ?? {},
  };
}

async function scoreWithAnthropic(
  prompt: string,
  apiKey: string,
): Promise<{ score: number; breakdown: Record<string, unknown> }> {
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
    throw new Error(`Claude API error: ${errText}`);
  }
  const anthropicJson = await response.json();
  const parsed = parseScoreFromAnthropicJson(anthropicJson);
  return {
    score: Math.min(100, Math.max(0, Math.round(parsed.score))),
    breakdown: parsed.breakdown ?? {},
  };
}

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

  const geminiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  let score: number;
  let breakdown: Record<string, unknown> = {};

  try {
    if (geminiKey) {
      const r = await scoreWithGemini(prompt, geminiKey);
      score = r.score;
      breakdown = r.breakdown;
    } else if (anthropicKey) {
      const r = await scoreWithAnthropic(prompt, anthropicKey);
      score = r.score;
      breakdown = r.breakdown;
    } else {
      score = 72;
      breakdown = {
        mock: true,
        note:
          "Set GEMINI_API_KEY (preferred) or ANTHROPIC_API_KEY for real AI scoring",
      };
    }
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "scoring failed",
      },
      { status: 502 },
    );
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
