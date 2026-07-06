'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getRoot,
  $getSelection,
  $isParagraphNode,
  $isRangeSelection,
  type LexicalEditor,
} from 'lexical';
import { $dfs } from '@lexical/utils';
import { $isAgentBlockNode } from './AgentBlockNode';
import { $createPopulatedQueryInputNode } from './QueryInputNode';
import { $createPopulatedResearchConversationNode } from './ResearchConversationNode';
import { useResearchWorkspaceApiOptional } from '../researchWorkspaceContext';

/**
 * Insert a full v2 conversation block (transcript + reply composer) bound to
 * `conversationId` at the current selection: replace the cursor's block if it's
 * an empty paragraph, otherwise insert right after it (append at the end if
 * there's no selection), with a trailing paragraph for the cursor to land on.
 * Returns the block's key.
 */
export function $insertConversationBlockAtSelection(conversationId: string): string {
  const { node } = $createPopulatedResearchConversationNode(conversationId);
  const selection = $getSelection();
  const block = $isRangeSelection(selection) ? selection.anchor.getNode().getTopLevelElement() : null;
  const trailing = $createParagraphNode();
  if (block && $isParagraphNode(block) && block.getTextContentSize() === 0) {
    block.replace(node);
  } else if (block) {
    block.insertAfter(node);
  } else {
    $getRoot().append(node);
  }
  node.insertAfter(trailing);
  trailing.selectStart();
  return node.getKey();
}

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

      if (intent.kind === 'insert-conversation-block') {
        // Instant — no `writeReady` wait: the target is the already-open,
        // already-synced active doc, so there's no initial-sync race to guard
        // against (unlike insert-query into a fresh scratch doc).
        let insertedKey: string | null = null;
        editor.update(() => {
          insertedKey = $insertConversationBlockAtSelection(intent.conversationId);
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
