'use client';

import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createParagraphNode,
  $getNodeByKey,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_HIGH,
  KEY_ENTER_COMMAND,
  type ElementNode,
  type LexicalEditor,
  type RangeSelection,
} from 'lexical';
import { $createAgentBlockNode, $isAgentBlockNode } from './AgentBlockNode';
import { UPDATE_AGENT_BLOCK_COMMAND } from './AgentBlockPlugin';
import { useResearchEditorEnvironment, type ResearchEditorEnvironment } from './ResearchEditorContext';
import { newResearchAnchorId } from './ResearchAnchorContext';

/**
 * Trailing space is part of the prefix so a bare `/query` (with nothing
 * after) doesn't accidentally match.
 */
export const QUERY_COMMAND_PREFIX = '/query ';

/**
 * On Enter at the end of a `/query <prompt>` line, replaces the line's inline
 * content with an empty AgentBlock and fires the query. The conversationId
 * comes back asynchronously and patches the placeholder via
 * UPDATE_AGENT_BLOCK_COMMAND.
 *
 * Mid-line Enter and bare-`/query` Enter fall through, so this only
 * intercepts the "submit" gesture.
 */
export function QueryCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  const env = useResearchEditorEnvironment();

  useEffect(() => {
    const unregister = editor.registerCommand(
      KEY_ENTER_COMMAND,
      (event) => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;

        const block = selection.anchor.getNode().getTopLevelElement();
        if (!block) return false;

        const text = block.getTextContent();
        if (!text.startsWith(QUERY_COMMAND_PREFIX)) return false;

        const prompt = text.slice(QUERY_COMMAND_PREFIX.length).trim();
        if (!prompt) return false;

        if (!isCursorAtBlockEnd(block, selection)) return false;

        const agentBlock = $createAgentBlockNode({
          conversationId: '',
          producedByConversationId: null,
        });
        const agentBlockKey = agentBlock.getKey();

        // Defer to the block's `insertNewAfter` so Enter inside a list item
        // stays in the list, Enter inside a quote stays quoted, etc. Falls
        // back to a paragraph for nodes that opt out (return null).
        const newAfter = block.insertNewAfter(selection, true);
        let trailing: ElementNode;
        if ($isElementNode(newAfter)) {
          trailing = newAfter;
        } else {
          const fallback = $createParagraphNode();
          block.insertAfter(fallback);
          trailing = fallback;
        }

        // Snapshot before mutating: `getChildren()` returns a live array on
        // some Lexical versions, so iterating while removing skips nodes.
        const existing = [...block.getChildren()];
        for (const child of existing) child.remove();
        block.append(agentBlock);

        trailing.select();

        // Defer past Lexical's update cycle so dispatching
        // UPDATE_AGENT_BLOCK_COMMAND doesn't reenter mid-update.
        queueMicrotask(() => {
          void fireQuery({ editor, env, agentBlockKey, prompt });
        });

        event?.preventDefault();
        return true;
      },
      // HIGH so we beat Lexical's default paragraph-splitting Enter handler.
      COMMAND_PRIORITY_HIGH,
    );
    return () => unregister();
  }, [editor, env]);

  return null;
}

function isCursorAtBlockEnd(block: ElementNode, selection: RangeSelection): boolean {
  const last = block.getLastDescendant();
  if (!last) return false;
  if ($isTextNode(last)) {
    return (
      selection.anchor.key === last.getKey() &&
      selection.anchor.offset === last.getTextContentSize()
    );
  }
  // For non-text trailing descendants (e.g. a line break), the anchor lands
  // on the parent element with offset === parent's child count.
  const parent = last.getParent();
  if (!parent) return false;
  return (
    selection.anchor.key === parent.getKey() &&
    selection.anchor.offset === parent.getChildrenSize()
  );
}

interface FireQueryArgs {
  editor: LexicalEditor;
  env: ResearchEditorEnvironment;
  agentBlockKey: string;
  prompt: string;
}

async function fireQuery({ editor, env, agentBlockKey, prompt }: FireQueryArgs): Promise<void> {
  try {
    const anchorId = newResearchAnchorId();
    const { conversationId } = await env.fireDocumentQuery({
      documentId: env.documentId,
      anchorId,
      prompt,
    });
    editor.dispatchCommand(UPDATE_AGENT_BLOCK_COMMAND, {
      nodeKey: agentBlockKey,
      conversationId,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[research] /query failed to fire', err);
    editor.update(() => {
      const node = $getNodeByKey(agentBlockKey);
      if ($isAgentBlockNode(node)) node.remove();
    });
  }
}
