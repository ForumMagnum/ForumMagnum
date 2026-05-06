import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
  type NodeKey,
} from 'lexical';
import { $findMatchingParent } from '@lexical/utils';
import { $isElementNode } from 'lexical';
import { useEffect } from 'react';
import { $createAgentBlockNode, $isAgentBlockNode, type AgentBlockProps } from './AgentBlockNode';

export interface InsertAgentBlockPayload {
  conversationId: string;
  producedByConversationId?: string | null;
  /**
   * Where to place the block:
   *   `at-selection` — insert at current selection (replaces it, splits paragraph if needed).
   *   `after-selection` — insert immediately after the block containing the current selection.
   * Default: `at-selection`.
   */
  placement?: 'at-selection' | 'after-selection';
}

export interface UpdateAgentBlockPayload {
  nodeKey: NodeKey;
  conversationId?: string;
  producedByConversationId?: string | null;
}

export const INSERT_AGENT_BLOCK_COMMAND: LexicalCommand<InsertAgentBlockPayload> = createCommand(
  'INSERT_AGENT_BLOCK_COMMAND',
);

export const UPDATE_AGENT_BLOCK_COMMAND: LexicalCommand<UpdateAgentBlockPayload> = createCommand(
  'UPDATE_AGENT_BLOCK_COMMAND',
);

export function AgentBlockPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const insertHandler = editor.registerCommand(
      INSERT_AGENT_BLOCK_COMMAND,
      (payload) => {
        const props: AgentBlockProps = {
          conversationId: payload.conversationId,
          producedByConversationId: payload.producedByConversationId ?? null,
        };

        if (payload.placement === 'after-selection') {
          const selection = $getSelection();
          if (!$isRangeSelection(selection)) return false;
          const anchorNode = selection.anchor.getNode();
          const blockParent = $findMatchingParent(
            anchorNode,
            (node) => $isElementNode(node) && !node.isInline(),
          );
          const newNode = $createAgentBlockNode(props);
          if (blockParent) {
            blockParent.insertAfter(newNode);
          } else {
            $insertNodes([newNode]);
          }
          return true;
        }

        const newNode = $createAgentBlockNode(props);
        $insertNodes([newNode]);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    const updateHandler = editor.registerCommand(
      UPDATE_AGENT_BLOCK_COMMAND,
      ({ nodeKey, conversationId, producedByConversationId }) => {
        const node = $getNodeByKey(nodeKey);
        if (!$isAgentBlockNode(node)) return false;
        if (conversationId !== undefined) node.setConversationId(conversationId);
        if (producedByConversationId !== undefined) node.setProducedByConversationId(producedByConversationId);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );

    return () => {
      insertHandler();
      updateHandler();
    };
  }, [editor]);

  return null;
}
