import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { LexicalEditor } from "lexical";
import { withMainDocEditorSession } from "../../agent/editorAgentUtil";

/**
 * Thin wrapper around the (generalized) `withMainDocEditorSession` that pins
 * `collectionName: 'ResearchDocuments'`. Keeps research route handlers from
 * having to know about the collection-name parameter at every call site.
 *
 * Per T1's generalization (#5), `withMainDocEditorSession` takes
 * `{ collectionName, documentId, ... }` instead of `{ postId, ... }`.
 */
export async function withResearchDocEditorSession<T>({
  documentId,
  token,
  operationLabel,
  callback,
}: {
  documentId: string;
  token: string;
  operationLabel: string;
  callback: (args: { editor: LexicalEditor; provider: HocuspocusProvider }) => Promise<T>;
}): Promise<T> {
  return withMainDocEditorSession({
    collectionName: "ResearchDocuments",
    documentId,
    token,
    operationLabel,
    callback,
  });
}
