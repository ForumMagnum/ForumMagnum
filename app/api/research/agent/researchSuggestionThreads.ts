import { tryCreateSuggestionThreadInCommentsDoc } from "../../agent/suggestionThreads";
import type { SuggestionSummaryItem } from "@/components/editor/lexicalPlugins/suggestedEdits/suggestionSummaryUtils";
import type { ReplaceMode } from "../../agent/toolSchemas";

export const RESEARCH_AGENT_AUTHOR_NAME = "Research Agent";

/**
 * Create the review thread for a suggest-mode research-document edit, when
 * one is needed: no-ops unless the edit ran in suggest mode and actually
 * produced a suggestion. Best-effort — by the time this runs the suggestion
 * is already applied to the live document, so a thread failure is reported
 * via the return value (for a response warning) rather than thrown; failing
 * the request would invite a retry that stacks a duplicate suggestion.
 *
 * The thread author is the conversation id, so all suggestions from one
 * conversation share an author (which is what reject-own-suggestion
 * permissions key on).
 */
export async function maybeCreateResearchSuggestionThread({
  mode,
  documentId,
  hocuspocusToken,
  suggestionId,
  summaryItems,
  conversationId,
}: {
  mode: ReplaceMode
  documentId: string
  hocuspocusToken: string
  /** From the edit result; undefined when no suggestion was created. */
  suggestionId: string | undefined
  summaryItems: SuggestionSummaryItem[]
  /** Always present for agent-scoped tokens; optional only for TS narrowing. */
  conversationId: string | undefined
}): Promise<{ threadCreationFailed: boolean }> {
  if (mode !== "suggest" || !suggestionId || !conversationId) {
    return { threadCreationFailed: false };
  }
  const created = await tryCreateSuggestionThreadInCommentsDoc({
    collectionName: "ResearchDocuments",
    documentId,
    token: hocuspocusToken,
    suggestionId,
    summaryItems,
    authorName: RESEARCH_AGENT_AUTHOR_NAME,
    authorId: conversationId,
  });
  return { threadCreationFailed: !created };
}
