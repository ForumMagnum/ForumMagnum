'use client';

import { useContext, useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useMutation } from '@apollo/client/react';
import {
  $createParagraphNode,
  $createRangeSelection,
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  KEY_BACKSPACE_COMMAND,
  KEY_DOWN_COMMAND,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { $findMatchingParent, mergeRegister } from '@lexical/utils';
import { gql } from '@/lib/generated/gql-codegen';
import { randomId } from '@/lib/random';
import { htmlToTextDefault } from '@/lib/htmlToText';
import { pushOptimisticEvent, type ConversationEvent } from '@/components/research/hooks/useConversationStream';
import {
  $isConversationComposerNode,
  ConversationComposerNode,
} from './ConversationComposerNode';
import { $createQueryInputContentNode, $isQueryInputContentNode, QueryInputContentNode } from './QueryInputContentNode';
import { useResearchEditorEnvironment, type ResearchEditorEnvironment } from './ResearchEditorContext';
import { isSandboxWarmingError } from '../sandboxWarming';
import { resolveInitialSelection } from '../useModelEffortSelection';
import { useMessages } from '@/components/common/withMessages';
import { type WithMessagesFunctions } from '@/components/layout/FlashMessages';
import { EditorUserModeContext } from '@/components/common/sharedContexts';
import { EditorUserMode } from '@/components/editor/lexicalPlugins/suggestions/EditorUserMode';

const SUGGESTION_MODE_MESSAGE = 'Conversation composers are not supported in suggesting mode';

const ContinueResearchConversationFromDocumentComposerMutation = gql(`
  mutation ContinueResearchConversationFromDocumentComposer($conversationId: String!, $promptHtml: String!, $activeDocumentId: String!, $model: String, $effort: String) {
    continueResearchConversation(conversationId: $conversationId, promptHtml: $promptHtml, activeDocumentId: $activeDocumentId, model: $model, effort: $effort) {
      conversationId
    }
  }
`);

function $ensureConversationComposerStructure(node: ConversationComposerNode): void {
  let content: QueryInputContentNode | null = null;
  const strayChildren: LexicalNode[] = [];
  for (const child of node.getChildren()) {
    if ($isQueryInputContentNode(child)) {
      if (content === null) content = child;
      else {
        for (const grandchild of child.getChildren()) content.append(grandchild);
        child.remove();
      }
    } else {
      strayChildren.push(child);
    }
  }
  if (content === null) content = $createQueryInputContentNode();
  for (const stray of strayChildren) content.append(stray);
  if (content.getChildrenSize() === 0) content.append($createParagraphNode());
  if (node.getFirstChild() !== content) node.append(content);
}

function $dissolveConversationComposer(node: ConversationComposerNode): void {
  const replacement = $createParagraphNode();
  node.replace(replacement);
  replacement.selectStart();
}

interface SendArgs {
  editor: LexicalEditor;
  env: ResearchEditorEnvironment;
  composerKey: string;
  conversationId: string;
  promptHtml: string;
  continueConversation: (opts: { variables: { conversationId: string; promptHtml: string; activeDocumentId: string; model?: string; effort?: string } }) => Promise<unknown>;
  flash: WithMessagesFunctions['flash'];
}

async function sendContinue({
  editor,
  env,
  composerKey,
  conversationId,
  promptHtml,
  continueConversation,
  flash,
}: SendArgs): Promise<void> {
  try {
    // Honor the conversation's per-device model/effort selection (set from its
    // chat/agent-block picker), read fresh at send time.
    const { model, effort } = resolveInitialSelection(conversationId);
    await continueConversation({
      variables: { conversationId, promptHtml, activeDocumentId: env.documentId, model, effort },
    });
  } catch (err) {
    if (isSandboxWarmingError(err)) {
      flash({ messageString: 'The sandbox is still starting up — try again in a moment.' });
    } else {
      // eslint-disable-next-line no-console
      console.error('[research] conversation composer failed to send', err);
      flash({ messageString: 'Failed to send message — try again.', type: 'error' });
    }
    // Restore the (optimistically-cleared) draft so the user doesn't lose it.
    editor.update(() => {
      const node = $getNodeByKey(composerKey);
      if (!$isConversationComposerNode(node)) return;
      const content = node.getChildren().find($isQueryInputContentNode);
      if (!content || content.getTextContent().trim().length > 0) return;
      const dom = new DOMParser().parseFromString(promptHtml, 'text/html');
      const parsed = $generateNodesFromDOM(editor, dom);
      const restored: LexicalNode[] = [];
      for (const n of parsed) {
        if ($isQueryInputContentNode(n)) restored.push(...n.getChildren());
        else restored.push(n);
      }
      if (restored.length === 0) return;
      content.clear();
      for (const child of restored) content.append(child);
      content.getLastDescendant()?.selectEnd();
    });
  }
}

/**
 * Behaviour for the in-document conversation composer (ConversationComposerNode),
 * the reply box baked into each v2 conversation block: Cmd/Ctrl+Enter to send
 * (fires `continueResearchConversation` and clears the draft),
 * backspace-to-dissolve, and structure normalization.
 */
export function ConversationComposerPlugin() {
  const [editor] = useLexicalComposerContext();
  const env = useResearchEditorEnvironment();
  const { flash } = useMessages();
  const [continueConversation] = useMutation(ContinueResearchConversationFromDocumentComposerMutation);
  // Read the mutation through a ref so the long-lived command handlers don't
  // re-register when its identity changes.
  const continueRef = useRef(continueConversation);
  continueRef.current = continueConversation;
  const externalModeContext = useContext(EditorUserModeContext);
  const isSuggestionModeRef = useRef(false);
  isSuggestionModeRef.current = externalModeContext?.userMode === EditorUserMode.Suggest;

  useEffect(() => {
    if (!editor.hasNodes([ConversationComposerNode, QueryInputContentNode])) {
      throw new Error('ConversationComposerPlugin: ConversationComposerNode / QueryInputContentNode not registered on editor');
    }

    return mergeRegister(
      // Submit on Cmd/Ctrl+Enter inside a composer (see QueryInputPlugin for why
      // this runs at KEY_DOWN + CRITICAL).
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          if (event.key !== 'Enter' || !(event.metaKey || event.ctrlKey)) return false;
          if (event.isComposing) return false;

          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;

          const composer = $findMatchingParent(selection.anchor.getNode(), $isConversationComposerNode);
          if (!composer) return false;

          if (isSuggestionModeRef.current) {
            flash({ messageString: SUGGESTION_MODE_MESSAGE, type: 'error' });
            event.preventDefault();
            return true;
          }

          if (!composer.getTextContent().trim()) {
            event.preventDefault();
            return true;
          }

          const contentNode = composer.getChildren().find($isQueryInputContentNode);
          if (!contentNode) return false;

          const contentSelection = $createRangeSelection();
          contentSelection.anchor.set(contentNode.getKey(), 0, 'element');
          contentSelection.focus.set(contentNode.getKey(), contentNode.getChildrenSize(), 'element');
          const promptHtml = $generateHtmlFromNodes(editor, contentSelection);
          const conversationId = composer.getConversationId();
          const composerKey = composer.getKey();

          // Instant echo: drop an optimistic user turn into the shared store so
          // the conversation's transcript (in a v2 block, or anywhere else
          // showing it) reflects the send immediately, before the server round
          // trip. Cleared once the persisted twin lands (see useConversationStream).
          const optimisticEvent: ConversationEvent = {
            _id: `optimistic:user:${randomId()}`,
            conversationId,
            seq: -1,
            kind: 'user',
            claudeMessageUuid: null,
            payload: { type: 'user', message: { role: 'user', content: htmlToTextDefault(promptHtml) } },
            createdAt: new Date().toISOString(),
          };
          pushOptimisticEvent(conversationId, optimisticEvent);

          // Clear the draft optimistically so it disappears (for everyone) the
          // moment it's sent, leaving the composer ready for the next message.
          contentNode.clear();
          const fresh = $createParagraphNode();
          contentNode.append(fresh);
          fresh.selectStart();

          event.preventDefault();
          queueMicrotask(() => {
            void sendContinue({
              editor,
              env,
              composerKey,
              conversationId,
              promptHtml,
              continueConversation: continueRef.current,
              flash,
            });
          });
          return true;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),

      // Backspace at the start of an empty composer → dissolve to a paragraph.
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;
          if (selection.anchor.offset !== 0) return false;

          const composer = $findMatchingParent(selection.anchor.getNode(), $isConversationComposerNode);
          if (!composer) return false;

          const content = composer.getChildren().find($isQueryInputContentNode);
          if (!content) return false;
          if (content.getChildrenSize() !== 1) return false;
          const only = content.getFirstChild();
          if (!$isElementNode(only)) return false;
          if (only.getTextContentSize() !== 0) return false;

          if (isSuggestionModeRef.current) {
            flash({ messageString: SUGGESTION_MODE_MESSAGE, type: 'error' });
            event.preventDefault();
            return true;
          }

          event.preventDefault();
          $dissolveConversationComposer(composer);
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),

      editor.registerNodeTransform(ConversationComposerNode, $ensureConversationComposerStructure),
    );
  }, [editor, env, flash]);

  return null;
}
