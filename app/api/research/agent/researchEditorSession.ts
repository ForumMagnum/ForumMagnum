import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { LexicalEditor } from "lexical";
import { withMainDocEditorSession } from "../../agent/editorAgentUtil";

/**
 * Thin wrapper around the (generalized) `withMainDocEditorSession` that pins
 * `collectionName: 'ResearchDocuments'`. The headless editor registers every
 * custom node type the codebase defines (see `allLexicalNodes`), so research-
 * specific nodes like `AgentBlockNode` and the research `MentionNode` are
 * already covered.
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
