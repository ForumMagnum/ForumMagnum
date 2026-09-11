'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, type LexicalEditor } from 'lexical';
import { $dfs } from '@lexical/utils';
import { $isAgentBlockNode } from './AgentBlockNode';
import { $createPopulatedQueryInputNode } from './QueryInputNode';
import { useResearchWorkspaceApiOptional } from '../researchWorkspaceContext';

/**
 * How long after mount we assume the collaborative document has synced even
 * if no collaboration-tagged update arrived (an empty Yjs doc produces none).
 * Mutating before sync risks racing the initial remote state, so writes wait
 * for sync-or-deadline; reads (finding an existing block) run on every
 * update immediately.
 */
const COLLAB_SYNC_DEADLINE_MS = 1500;

/**
 * How long to keep looking for the conversation's block before concluding it
 * isn't in this document (deleted, or a legacy blockless conversation) and
 * falling back to the chat panel. Generous because a false "missing" (sync
 * still in flight) would bounce the user to the panel when the block was
 * about to appear.
 */
const BLOCK_MISSING_DEADLINE_MS = 4000;

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

export function WorkspaceIntentPlugin() {
  const [editor] = useLexicalComposerContext();
  const workspace = useResearchWorkspaceApiOptional();
  const intent = workspace?.editorIntent ?? null;

  useEffect(() => {
    if (!workspace || !intent) return;
    const { nonce } = intent;
    let done = false;
    let writeReady = false;

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

      const existingKey = editor.read(() => $findAgentBlockKey(intent.conversationId));
      if (existingKey) {
        workspace.requestConversationFocus(intent.conversationId);
        finish();
      }
    };

    const removeUpdateListener = editor.registerUpdateListener(({ tags }) => {
      if (tags.has('collaboration')) {
        writeReady = true;
      }
      tryExecute();
    });
    const writeDeadlineTimer = setTimeout(() => {
      writeReady = true;
      tryExecute();
    }, COLLAB_SYNC_DEADLINE_MS);
    const blockMissingTimer = setTimeout(() => {
      if (done || intent.kind !== 'focus-conversation') return;
      workspace.openConversationChat(intent.conversationId);
      finish();
    }, BLOCK_MISSING_DEADLINE_MS);
    const giveUpTimer = setTimeout(() => {
      if (!done) finish();
    }, INTENT_TIMEOUT_MS);

    tryExecute();

    return () => {
      removeUpdateListener();
      clearTimeout(writeDeadlineTimer);
      clearTimeout(blockMissingTimer);
      clearTimeout(giveUpTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, workspace, intent?.nonce]);

  return null;
}
