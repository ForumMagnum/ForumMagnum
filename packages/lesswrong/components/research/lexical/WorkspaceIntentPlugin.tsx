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
 * `active` gates whether this editor acts on workspace intents. During a
 * document swap two editors are mounted at once (the outgoing document stays
 * visible while the incoming one loads); only the pane whose document is the
 * navigation target should handle intents. Otherwise the stale/visible editor —
 * searching the wrong document — would hit the focus-conversation fallback and
 * spuriously open the chat in the side panel.
 */
export function WorkspaceIntentPlugin({ active = true }: { active?: boolean } = {}) {
  const [editor] = useLexicalComposerContext();
  const workspace = useResearchWorkspaceApiOptional();
  const intent = workspace?.editorIntent ?? null;

  useEffect(() => {
    if (!workspace || !intent || !active) return;
    const { nonce } = intent;
    let done = false;
    let writeReady = false;
    // Set only on a real collaboration sync (never by the write-ready deadline),
    // so the focus-conversation fallback can distinguish "synced, block genuinely
    // absent" from "still loading".
    let synced = false;

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

      // focus-conversation: scroll to the conversation's inline block and raise
      // its focus request. Fall back to the side panel only once the document has
      // actually synced and the block still isn't here — so a slow-loading target
      // doc isn't mistaken for a missing block.
      const existingKey = editor.read(() => $findAgentBlockKey(intent.conversationId));
      if (existingKey) {
        workspace.requestConversationFocus(intent.conversationId);
        finish();
        return;
      }
      if (synced) {
        workspace.openConversationChat(intent.conversationId);
        finish();
      }
    };

    const removeUpdateListener = editor.registerUpdateListener(({ tags }) => {
      if (tags.has('collaboration')) {
        writeReady = true;
        synced = true;
      }
      tryExecute();
    });
    const writeDeadlineTimer = setTimeout(() => {
      writeReady = true;
      tryExecute();
    }, COLLAB_SYNC_DEADLINE_MS);
    // Backstop for a document that never syncs (e.g. offline): surface the chat
    // in the side panel rather than leaving the click with no effect.
    const giveUpTimer = setTimeout(() => {
      if (done) return;
      if (intent.kind === 'focus-conversation') {
        workspace.openConversationChat(intent.conversationId);
      }
      finish();
    }, INTENT_TIMEOUT_MS);

    tryExecute();

    return () => {
      removeUpdateListener();
      clearTimeout(writeDeadlineTimer);
      clearTimeout(giveUpTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, workspace, intent?.nonce, active]);

  return null;
}
