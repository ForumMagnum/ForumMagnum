import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { LexicalEditor } from "lexical";
import { researchEditorNodes } from "@/components/research/lexical/researchEditorNodes";
import { withMainDocEditorSession } from "../../agent/editorAgentUtil";

/**
 * Thin wrapper around the (generalized) `withMainDocEditorSession` that pins
 * `collectionName: 'ResearchDocuments'` and registers the research-only
 * Lexical node types on the headless editor.
 *
 * Why `extraNodes` matters: the persisted Yjs state can contain custom
 * research node types — `AgentBlockNode` (inserted from the document via
 * slash menu / pending prompt form) and `MentionNode` (document /
 * conversation references). The default `PlaygroundNodes` set the headless
 * editor uses doesn't know those types, so a Yjs sync containing one would
 * fail to materialize and the editor root would be empty — tripping the
 * post-sync emptiness guard with a misleading "Yjs document state is
 * missing or corrupt" message. Use the same node registry as the live
 * editor so the headless and live sets stay in lockstep.
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
    extraNodes: researchEditorNodes,
  });
}
