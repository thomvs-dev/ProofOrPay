/**
 * Prompt + parsing helpers for Claude-based proof scoring (see pact_protocol_spec.md).
 */

export function buildScorePrompt(proofUrl: string, goal: string, repoContext: string): string {
  return `You are evaluating a software project submission for quality.
Score the following project 0–100 based on these criteria:

1. Working deployed link exists (0 or 25 pts)
2. GitHub has 3+ meaningful commits (0 or 20 pts)
3. README explains what the project does (0 or 20 pts)
4. Code is non-trivial (not a template/boilerplate) (0 or 20 pts)
5. Project matches the stated goal: "${goal}" (0 or 15 pts)

Proof URL: ${proofUrl}
Stated goal: ${goal}

Optional context (may be empty):
${repoContext}

Respond with ONLY a JSON object: { "score": <number>, "breakdown": { ... } }`;
}

export type ScoreResult = {
  score: number;
  breakdown: Record<string, unknown>;
};

export function parseScoreFromAnthropicJson(body: unknown): ScoreResult {
  const root = body as {
    content?: Array<{ text?: string }>;
  };
  const text = root.content?.[0]?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("No JSON in model response");
  }
  const parsed = JSON.parse(jsonMatch[0]) as ScoreResult;
  if (typeof parsed.score !== "number") {
    throw new Error("Invalid score in response");
  }
  return parsed;
}

/** Best-effort GitHub metadata string for the scoring prompt. */
export async function fetchGithubMeta(proofUrl: string): Promise<string> {
  try {
    const u = new URL(proofUrl);
    if (u.hostname !== "github.com" && !u.hostname.endsWith(".github.io")) {
      return "";
    }
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return "";
    const api = `https://api.github.com/repos/${parts[0]}/${parts[1]}`;
    const res = await fetch(api, {
      headers: { Accept: "application/vnd.github+json" },
      next: { revalidate: 60 },
    });
    if (!res.ok) return "";
    const j = (await res.json()) as {
      description?: string;
      stargazers_count?: number;
      pushed_at?: string;
    };
    return `Repo: ${parts[0]}/${parts[1]}. ${j.description ?? ""}. Last push: ${j.pushed_at ?? "unknown"}.`;
  } catch {
    return "";
  }
}
