import { getAnthropicClientOrThrow } from "@/server/languageModels/anthropicClient";
import * as fs from "fs";

/* eslint-disable no-console */

/**
 * LLM-judge spam eval: for each user in a sample file produced by
 * prepareLlmEvalSample.py, ask Claude Opus 4.8 "is this obviously spam?" and
 * record the verdict alongside the ground-truth label and the ML model's score.
 *
 * Usage:
 *   yarn repl dev lw packages/lesswrong/scripts/spamClassifier/llmSpamEval.ts "llmSpamEval('/path/llm_eval_sample.jsonl', '/path/llm_verdicts.jsonl')"
 */

const MODEL = "claude-opus-4-8";
const CONCURRENCY = 8;
const MAX_FIELD_CHARS = 1500;

const SYSTEM_PROMPT = `You are a moderator for LessWrong, a discussion forum about rationality, AI safety, and related topics. You are reviewing new user accounts to decide whether each one is OBVIOUS SPAM.

Obvious spam means the account exists to promote something unrelated to the forum: SEO link-building, commercial services or products, escort/gambling/crypto promotion, link-drop bios, keyword-stuffed posts, etc.

NOT spam (even if low quality): genuine attempts to engage with the forum's topics, LLM-assisted crackpot physics/AI theories, confused newbies, self-promotion of relevant blogs/research, personal websites in bios from users whose content engages genuinely, test-looking accounts with no commercial intent.

Respond with ONLY a JSON object, no other text:
{"verdict": "spam" | "not_spam", "confidence": <0.0-1.0>, "reason": "<one short sentence>"}

"spam" with high confidence should mean you'd be comfortable auto-banning the account with no human review.`;

interface SampleUser {
  _id: string;
  displayName: string | null;
  username: string | null;
  createdAt: string;
  bio_html: string | null;
  map_location: string | null;
  map_marker_text: string | null;
  is_spam: boolean;
  ml_score: number;
  posts: Array<{ title: string | null; html: string | null; createdAt: string }> | null;
  comments: Array<{ html: string | null; createdAt: string }> | null;
  tag_revisions: Array<{ html: string | null; commitMessage: string | null }> | null;
}

function stripHtml(html: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_FIELD_CHARS);
}

function extractLinks(html: string | null): string[] {
  if (!html) return [];
  const matches = html.match(/(?:href|src)\s*=\s*["']([^"']+)["']/gi) ?? [];
  return matches.map(m => m.replace(/^(?:href|src)\s*=\s*["']/i, "").replace(/["']$/, "")).slice(0, 10);
}

function formatUser(u: SampleUser): string {
  const parts: string[] = [];
  parts.push(`Username: ${u.username ?? "(none)"}`);
  parts.push(`Display name: ${u.displayName ?? "(none)"}`);
  parts.push(`Account created: ${u.createdAt.slice(0, 10)}`);
  const bio = stripHtml(u.bio_html);
  const bioLinks = extractLinks(u.bio_html);
  parts.push(`Bio: ${bio || "(none)"}`);
  if (bioLinks.length) parts.push(`Links in bio: ${bioLinks.join(" ")}`);
  if (u.map_location || u.map_marker_text) {
    parts.push(`Map pin: ${u.map_location ?? ""} ${stripHtml(u.map_marker_text)}`.trim());
  }
  for (const p of u.posts ?? []) {
    const links = extractLinks(p.html);
    parts.push(`Post: "${p.title ?? ""}" — ${stripHtml(p.html) || "(empty body)"}${links.length ? ` [links: ${links.join(" ")}]` : ""}`);
  }
  for (const c of u.comments ?? []) {
    const links = extractLinks(c.html);
    parts.push(`Comment: ${stripHtml(c.html) || "(empty)"}${links.length ? ` [links: ${links.join(" ")}]` : ""}`);
  }
  for (const t of u.tag_revisions ?? []) {
    parts.push(`Wiki/tag edit${t.commitMessage ? ` (${t.commitMessage})` : ""}: ${stripHtml(t.html) || "(empty)"}`);
  }
  return parts.join("\n");
}

interface Verdict {
  verdict: "spam" | "not_spam";
  confidence: number;
  reason: string;
}

function parseVerdict(text: string): Verdict | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (parsed.verdict !== "spam" && parsed.verdict !== "not_spam") return null;
    return {
      verdict: parsed.verdict,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      reason: String(parsed.reason ?? ""),
    };
  } catch {
    return null;
  }
}

async function judgeUser(u: SampleUser): Promise<Verdict | null> {
  const client = getAnthropicClientOrThrow();
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: `Is this new user obviously spam?\n\n${formatUser(u)}`,
        }],
      });
      const textBlock = response.content.find(b => b.type === "text");
      const verdict = textBlock && "text" in textBlock ? parseVerdict(textBlock.text) : null;
      if (verdict) return verdict;
      console.error(`Unparseable verdict for ${u._id}, attempt ${attempt + 1}`);
    } catch (err) {
      console.error(`API error for ${u._id}, attempt ${attempt + 1}:`, err instanceof Error ? err.message : err);
      await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
    }
  }
  return null;
}

export async function llmSpamEval(samplePath: string, outputPath: string) {
  const users: SampleUser[] = fs.readFileSync(samplePath, "utf8")
    .split("\n")
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
  console.log(`Judging ${users.length} users with ${MODEL}...`);

  const out = fs.createWriteStream(outputPath);
  let completed = 0;
  let index = 0;

  async function worker() {
    for (;;) {
      const i = index++;
      if (i >= users.length) return;
      const u = users[i];
      const verdict = await judgeUser(u);
      out.write(JSON.stringify({
        _id: u._id,
        displayName: u.displayName,
        createdAt: u.createdAt,
        is_spam: u.is_spam,
        ml_score: u.ml_score,
        llm_verdict: verdict?.verdict ?? "error",
        llm_confidence: verdict?.confidence ?? null,
        llm_reason: verdict?.reason ?? null,
      }) + "\n");
      completed++;
      if (completed % 25 === 0) console.log(`${completed}/${users.length} judged`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  await new Promise<void>((resolve, reject) => {
    out.on("error", reject);
    out.end(() => resolve());
  });
  console.log(`Done. ${completed} verdicts written to ${outputPath}`);
}
