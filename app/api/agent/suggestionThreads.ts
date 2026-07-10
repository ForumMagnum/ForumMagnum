import { HocuspocusProvider } from "@hocuspocus/provider";
import { Doc } from "yjs";
import {
  buildHocuspocusCommentsDocName,
  createHeadlessEditor,
  getLexicalCompatibleProvider,
  waitForProviderFlush,
  waitForProviderSync,
} from "./editorAgentUtil";

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
  const wsUrl = process.env.HOCUSPOCUS_URL;
  if (!wsUrl) {
    throw new Error("HOCUSPOCUS_URL is not configured");
  }

  const commentsDoc = new Doc();
  const provider = new HocuspocusProvider({
    url: wsUrl,
    name: buildHocuspocusCommentsDocName(collectionName, documentId),
    document: commentsDoc,
    token,
    connect: false,
  });

  const lexicalProvider = getLexicalCompatibleProvider(provider);
  const editor = createHeadlessEditor("AgentSuggestionThread");
  const commentStore = new CommentStore(editor);
  const unregister = commentStore.registerCollaboration(lexicalProvider);

  try {
    await provider.connect();
    await waitForProviderSync(provider);
    const controller = createSuggestionThreadController({
      commentStore,
      authorId,
      authorName,
    });
    const serializedSummary = JSON.stringify(summaryItems);
    await controller.createSuggestionThread(
      suggestionId,
      serializedSummary,
      summaryItems[0]?.type ?? "replace",
    );
  } finally {
    await waitForProviderFlush(provider);
    unregister();
    provider.destroy();
    commentsDoc.destroy();
  }
}
