import { NextResponse } from "next/server";
import {
  extractMentionTokens,
  rewriteMentionTokens,
} from "@/components/research/lexical/mentionFormat";
import { captureResearchAgentApiEvent } from "./captureResearchAgentAnalytics";
import type { SandboxCallbackTokenPayload } from "./researchAgentAuth";

interface ValidateAndCanonicalizeArgs {
  markdown: string;
  projectId: string;
  context: ResolverContext;
}

export type ValidateAndCanonicalizeResult =
  | { ok: true; markdown: string }
  | { ok: false; error: string };

export async function validateAndCanonicalizeMentionsInMarkdown({
  markdown,
  projectId,
  context,
}: ValidateAndCanonicalizeArgs): Promise<ValidateAndCanonicalizeResult> {
  const tokens = extractMentionTokens(markdown);
  if (tokens.length === 0) return { ok: true, markdown };

  const docIds = new Set<string>();
  const convIds = new Set<string>();
  for (const t of tokens) {
    if (t.kind === "doc") docIds.add(t.id);
    else convIds.add(t.id);
  }

  const [docs, convs] = await Promise.all([
    docIds.size > 0
      ? context.ResearchDocuments.find(
        { _id: { $in: [...docIds] }, projectId },
        {},
        { _id: 1, title: 1 },
      ).fetch()
      : Promise.resolve([]),
    convIds.size > 0
      ? context.ResearchConversations.find(
        { _id: { $in: [...convIds] }, projectId },
        {},
        { _id: 1, title: 1 },
      ).fetch()
      : Promise.resolve([]),
  ]);

  const docTitles = new Map<string, string>(
    docs.map((d) => [d._id, d.title ?? ""]),
  );
  const convTitles = new Map<string, string>(
    convs.map((c) => [c._id, c.title ?? ""]),
  );

  const canonicalById = new Map<string, string>();
  for (const t of tokens) {
    const map = t.kind === "doc" ? docTitles : convTitles;
    if (!map.has(t.id)) {
      const kindLabel = t.kind === "doc" ? "document" : "conversation";
      return {
        ok: false,
        error: `Mention references unknown ${kindLabel} (id "${t.id}") in this project: ${t.raw}. Only resources you've already encountered in this conversation or its source documents are valid.`,
      };
    }
    canonicalById.set(`${t.kind}:${t.id}`, map.get(t.id) ?? "");
  }

  const rewritten = rewriteMentionTokens(markdown, (match) => ({
    kind: match.kind,
    id: match.id,
    title: canonicalById.get(`${match.kind}:${match.id}`) ?? match.title,
  }));

  return { ok: true, markdown: rewritten };
}

/**
 * Run `validateAndCanonicalizeMentionsInMarkdown` and, on failure, emit the
 * standard `mention_validation_failed` analytics event and build the 400
 * NextResponse. Routes that want different analytics shape should call the
 * underlying function directly.
 */
export async function validateMentionsOrRespond({
  markdown,
  context,
  route,
  payload,
  documentId,
}: {
  markdown: string;
  context: ResolverContext;
  route: string;
  payload: SandboxCallbackTokenPayload;
  documentId?: string;
}): Promise<{ ok: true; markdown: string } | { ok: false; response: NextResponse }> {
  const result = await validateAndCanonicalizeMentionsInMarkdown({
    markdown,
    projectId: payload.projectId,
    context,
  });
  if (result.ok) return { ok: true, markdown: result.markdown };

  captureResearchAgentApiEvent({
    route,
    status: "validation_error",
    conversationId: payload.conversationId,
    projectId: payload.projectId,
    documentId,
    reason: "mention_validation_failed",
  });
  return {
    ok: false,
    response: NextResponse.json({ error: result.error }, { status: 400 }),
  };
}

