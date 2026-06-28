import { htmlToTextDefault } from "@/lib/htmlToText";
import { pangramApiKeySetting, pangramEnabledSetting } from "./databaseSettings";

const PANGRAM_ENDPOINT = "https://text.api.pangram.com/v3";
// Pangram's accuracy drops sharply on very short text; 50 words is their recommended floor.
const PANGRAM_MIN_WORDS = 50;
// Pangram v3 rejects overlong payloads; we truncate rather than error out.
const PANGRAM_MAX_CHARS = 50_000;
// Pangram v3 calls typically return in 1–3s; 30s leaves headroom for tail latency.
const PANGRAM_TIMEOUT_MS = 30_000;

export type PangramStatus = "scored" | "too_short" | "skipped_spam" | "error";

export interface PangramResult {
  status: PangramStatus;
  aiScore: number | null;
  rawResponse: unknown | null;
}

interface PangramV3Response {
  fraction_ai?: number | null;
  fraction_ai_assisted?: number | null;
  fraction_human?: number | null;
  headline?: string | null;
  prediction?: string | null;
  prediction_short?: string | null;
  [key: string]: unknown;
}

export function pangramIsConfigured(): boolean {
  return !!pangramEnabledSetting.get() && !!pangramApiKeySetting.get();
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function extractPangramInputFromPost(
  post: Pick<DbPost, "title">,
  html: string | null | undefined,
): string {
  // Title is intentionally folded into the scored text — it carries style signal Pangram uses.
  const body = htmlToTextDefault(html ?? "");
  return `${post.title ?? ""}\n\n${body}`.trim();
}

export function extractPangramInputFromComment(
  html: string | null | undefined,
): string {
  return htmlToTextDefault(html ?? "").trim();
}

// "Not fully reviewed" per getReasonForReview — includes never-reviewed and currently-snoozed users.
export function userIsUnreviewedForPangram(user: Pick<DbUser, "reviewedByUserId" | "snoozedUntilContentCount">): boolean {
  const fullyReviewed = !!user.reviewedByUserId && !user.snoozedUntilContentCount;
  return !fullyReviewed;
}

export function documentIsEligibleForPangram(document: {
  deleted?: boolean | null;
  rejected?: boolean | null;
  spam?: boolean | null;
  draft?: boolean | null;
}): { eligible: boolean; skipStatus?: PangramStatus } {
  // Spam/deleted: terminal states — record a skip so the badge shows "skipped" instead of sitting at "pending" forever.
  if (document.spam || document.deleted) {
    return { eligible: false, skipStatus: "skipped_spam" };
  }
  // Rejected/draft: reversible — deliberately do NOT record, so the badge stays "pending" and re-evaluates if the doc is un-rejected or published.
  if (document.rejected || document.draft) {
    return { eligible: false };
  }
  return { eligible: true };
}

async function callPangram(text: string): Promise<PangramResult> {
  const apiKey = pangramApiKeySetting.get();
  if (!apiKey) {
    return { status: "error", aiScore: null, rawResponse: { error: "missing_api_key" } };
  }

  const wasTruncated = text.length > PANGRAM_MAX_CHARS;
  const truncated = wasTruncated ? text.slice(0, PANGRAM_MAX_CHARS) : text;

  try {
    const response = await fetch(PANGRAM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ text: truncated }),
      signal: AbortSignal.timeout(PANGRAM_TIMEOUT_MS),
    });

    const rawResponse = (await response.json().catch(() => null)) as PangramV3Response | null;

    if (!response.ok) {
      return {
        status: "error",
        aiScore: null,
        rawResponse: { status: response.status, body: rawResponse },
      };
    }

    // v3 returns fraction_ai (0..1): proportion of content classified as AI-generated.
    const aiScore: number | null =
      typeof rawResponse?.fraction_ai === "number" ? rawResponse.fraction_ai : null;

    // Underscore-prefixed so they can't collide with Pangram's own fields if they ever add one.
    const annotatedResponse: PangramV3Response | null = rawResponse && wasTruncated
      ? { ...rawResponse, _truncated: true, _originalCharCount: text.length }
      : rawResponse;

    return {
      status: aiScore === null ? "error" : "scored",
      aiScore,
      rawResponse: annotatedResponse,
    };
  } catch (err) {
    return {
      status: "error",
      aiScore: null,
      rawResponse: { error: String(err) },
    };
  }
}

async function writePangramResultToRevision(
  revisionId: string,
  result: PangramResult,
  context: ResolverContext,
): Promise<void> {
  // rawUpdateOne avoids re-triggering revision edit callbacks, which would loop back into Pangram.
  const { Revisions } = context;
  await Revisions.rawUpdateOne(
    { _id: revisionId },
    {
      $set: {
        pangramAiScore: result.aiScore,
        pangramStatus: result.status,
        pangramCheckedAt: new Date(),
        pangramRawResponse: result.rawResponse ?? null,
      },
    },
  );
}

// Swallows its own errors — safe to call in a `void`-dispatched async context.
export async function runPangramOnRevision(
  revisionId: string,
  text: string,
  context: ResolverContext,
): Promise<PangramResult> {
  if (!pangramIsConfigured()) {
    // Write a terminal status even when disabled, so the badge doesn't stay on "pending" if an admin toggles Pangram off between scheduling and running.
    const result: PangramResult = { status: "error", aiScore: null, rawResponse: { error: "not_configured" } };
    await writePangramResultToRevision(revisionId, result, context);
    return result;
  }

  if (countWords(text) < PANGRAM_MIN_WORDS) {
    const result: PangramResult = { status: "too_short", aiScore: null, rawResponse: null };
    await writePangramResultToRevision(revisionId, result, context);
    return result;
  }

  const result = await callPangram(text);
  await writePangramResultToRevision(revisionId, result, context);
  return result;
}

export async function recordPangramSkip(
  revisionId: string,
  status: PangramStatus,
  context: ResolverContext,
): Promise<void> {
  await writePangramResultToRevision(
    revisionId,
    { status, aiScore: null, rawResponse: null },
    context,
  );
}
