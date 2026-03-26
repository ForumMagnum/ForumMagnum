import { HocuspocusProvider } from "@hocuspocus/provider";
import { Doc } from "yjs";
import { createHeadlessEditor, getLexicalCompatibleProvider, waitForProviderFlush, waitForProviderSync } from "./editorAgentUtil";

import { CommentStore } from "@/components/lexical/commenting";
import { createSuggestionThreadController } from "@/components/editor/lexicalPlugins/suggestions/createSuggestionThreadController";
import type { SuggestionSummaryItem } from "@/components/editor/lexicalPlugins/suggestedEdits/suggestionSummaryUtils";

export async function createSuggestionThreadInCommentsDoc({
  postId,
  token,
  suggestionId,
  summaryItems,
  authorName,
  authorId,
}: {
  postId: string
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
    name: `post-${postId}/comments`,
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
