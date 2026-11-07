import { Doc } from "yjs";
import {
  buildHocuspocusCommentsDocName,
  createHeadlessEditor,
} from "./editorAgentUtil";
import {
  connectAndSync,
  createHeadlessProvider,
  getLexicalCompatibleProvider,
  withProviderFlush,
} from "./headlessProvider";

import { CommentStore } from "@/components/lexical/commenting";
import { createSuggestionThreadController } from "@/components/editor/lexicalPlugins/suggestions/createSuggestionThreadController";
import type { SuggestionSummaryItem } from "@/components/editor/lexicalPlugins/suggestedEdits/suggestionSummaryUtils";
import { captureException } from "@/lib/sentryWrapper";

export interface CreateSuggestionThreadArgs {
  collectionName: string
  documentId: string
  token: string
  suggestionId: string
  summaryItems: SuggestionSummaryItem[]
  authorName: string
  authorId: string
}

/**
 * Best-effort variant of `createSuggestionThreadInCommentsDoc` for callers
 * that have already applied the suggestion to the live document: by that
 * point a thread failure shouldn't fail the whole request (the agent would
 * retry and stack a duplicate suggestion). Returns whether the thread was
 * created so callers can surface a warning instead.
 */
export async function tryCreateSuggestionThreadInCommentsDoc(args: CreateSuggestionThreadArgs): Promise<boolean> {
  try {
    await createSuggestionThreadInCommentsDoc(args);
    return true;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to create suggestion thread for ${args.collectionName} ${args.documentId}:`, error);
    captureException(error);
    return false;
  }
}

export async function createSuggestionThreadInCommentsDoc({
  collectionName,
  documentId,
  token,
  suggestionId,
  summaryItems,
  authorName,
  authorId,
}: {
  collectionName: string
  documentId: string
  token: string
  suggestionId: string
  summaryItems: SuggestionSummaryItem[]
  authorName: string
  authorId: string
}): Promise<void> {
  const commentsDoc = new Doc();
  const provider = createHeadlessProvider({
    name: buildHocuspocusCommentsDocName(collectionName, documentId),
    document: commentsDoc,
    token,
  });

  const lexicalProvider = getLexicalCompatibleProvider(provider);
  const editor = createHeadlessEditor("AgentSuggestionThread");
  const commentStore = new CommentStore(editor);
  const unregister = commentStore.registerCollaboration(lexicalProvider);

  try {
    await connectAndSync(provider);
    const controller = createSuggestionThreadController({
      commentStore,
      authorId,
      authorName,
    });
    const serializedSummary = JSON.stringify(summaryItems);
    await withProviderFlush(provider, () => controller.createSuggestionThread(
      suggestionId,
      serializedSummary,
      summaryItems[0]?.type ?? "replace",
    ));
  } finally {
    unregister();
    provider.destroy();
    commentsDoc.destroy();
  }
}
