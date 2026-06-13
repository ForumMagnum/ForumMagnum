'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getRoot, type LexicalEditor } from 'lexical';
import { $dfs } from '@lexical/utils';
import { $createAgentBlockNode, $isAgentBlockNode } from './AgentBlockNode';
import { $createPopulatedQueryInputNode } from './QueryInputNode';
import { useResearchWorkspaceApiOptional } from '../researchWorkspaceContext';

/**
 * How long after mount we assume the collaborative document has synced even
 * if no collaboration-tagged update arrived (an empty Yjs doc produces none).
 * Mutating before sync risks racing the initial remote state, so writes wait
 * for sync-or-deadline; reads (finding an existing block) run on every
 * update immediately. Materialization gets a longer deadline because acting
 * on a false "block missing" (sync still in flight) would append a duplicate
 * block, while a too-eager insert-query merely appears after a beat.
 */
const COLLAB_SYNC_DEADLINE_MS = 1500;
const MATERIALIZE_DEADLINE_MS = 4000;

/** Give up on an intent entirely after this long. */
const INTENT_TIMEOUT_MS = 15_000;

function $findAgentBlockKey(conversationId: string): string | null {
  for (const { node } of $dfs($getRoot())) {
    if ($isAgentBlockNode(node) && node.getConversationId() === conversationId) {
      return node.getKey();
    }
  }
  return null;
}

function scrollNodeIntoView(editor: LexicalEditor, nodeKey: string): void {
  const el = editor.getElementByKey(nodeKey);
  // 'instant' overrides any environment-injected `scroll-behavior: smooth`.
  el?.scrollIntoView({ block: 'center', behavior: 'instant' });
}

/**
 * Executes one-shot intents raised by the workspace shell (see
 * researchWorkspaceContext.tsx) once this editor is ready:
 *
 * - `insert-query`: append a fresh /query input at the end of the document
 *   and put the cursor in it ("start a new conversation").
 * - `focus-conversation`: find the AgentBlock bound to the conversation,
 *   scroll to it, and raise the block-level focus request it listens for.
 *   With `materializeIfMissing` (legacy chat-kind conversations being
 *   surfaced in the scratch document), append a block bound to the
 *   conversation if none exists yet.
 */
export function WorkspaceIntentPlugin() {
  const [editor] = useLexicalComposerContext();
  const workspace = useResearchWorkspaceApiOptional();
  const intent = workspace?.editorIntent ?? null;

  useEffect(() => {
    if (!workspace || !intent) return;
    const { nonce } = intent;
    let done = false;
    let writeReady = false;
    let materializeReady = false;

    const finish = () => {
      done = true;
      workspace.clearEditorIntent(nonce);
    };

    const tryExecute = () => {
      if (done) return;

      if (intent.kind === 'insert-query') {
        if (!writeReady) return;
        let insertedKey: string | null = null;
        editor.update(() => {
          const { node, content } = $createPopulatedQueryInputNode({ baseEnvironmentId: null, runtime: null });
          $getRoot().append(node);
          insertedKey = node.getKey();
          content.getFirstChild()?.selectStart();
        });
        if (insertedKey) scrollNodeIntoView(editor, insertedKey);
        finish();
        return;
      }

      // focus-conversation. Scrolling is owned by the block itself: on the
      // focus request it expands without animation and positions the
      // document in the same pre-paint frame, so the conversation appears
      // already open and scrolled to its latest messages.
      const existingKey = editor.read(() => $findAgentBlockKey(intent.conversationId));
      if (existingKey) {
        workspace.requestConversationFocus(intent.conversationId);
        finish();
        return;
      }
      if (intent.materializeIfMissing && materializeReady) {
        editor.update(() => {
          const block = $createAgentBlockNode({
            conversationId: intent.conversationId,
            producedByConversationId: null,
          });
          const root = $getRoot();
          root.append(block);
          // Trailing paragraph so the cursor has somewhere to land after the
          // decorator block.
          root.append($createParagraphNode());
        });
        workspace.requestConversationFocus(intent.conversationId);
        finish();
      }
    };

    const removeUpdateListener = editor.registerUpdateListener(({ tags }) => {
      if (tags.has('collaboration')) {
        writeReady = true;
        materializeReady = true;
      }
      tryExecute();
    });
    const writeDeadlineTimer = setTimeout(() => {
      writeReady = true;
      tryExecute();
    }, COLLAB_SYNC_DEADLINE_MS);
    const materializeDeadlineTimer = setTimeout(() => {
      materializeReady = true;
      tryExecute();
    }, MATERIALIZE_DEADLINE_MS);
    const giveUpTimer = setTimeout(() => {
      if (!done) finish();
    }, INTENT_TIMEOUT_MS);

    tryExecute();

    return () => {
      removeUpdateListener();
      clearTimeout(writeDeadlineTimer);
      clearTimeout(materializeDeadlineTimer);
      clearTimeout(giveUpTimer);
    };
    // Re-run per distinct intent; the intent object is stable for a given nonce.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, workspace, intent?.nonce]);

  return null;
}
