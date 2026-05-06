import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $isMarkNode,
  $unwrapMarkNode,
  $wrapSelectionInMarkNode,
  MarkNode,
} from '@lexical/mark';
import { mergeRegister, registerNestedElementResolver } from '@lexical/utils';
import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  type LexicalCommand,
  type NodeKey,
} from 'lexical';
import { useEffect } from 'react';
import {
  isResearchAnchorId,
  newResearchAnchorId,
  useResearchAnchorContext,
} from './ResearchAnchorContext';

interface WrapSelectionPayload {
  anchorId?: string;
  onCreated?: (anchorId: string) => void;
}

interface RemoveAnchorPayload {
  anchorId: string;
}

export const WRAP_SELECTION_AS_RESEARCH_ANCHOR_COMMAND: LexicalCommand<WrapSelectionPayload> = createCommand(
  'WRAP_SELECTION_AS_RESEARCH_ANCHOR_COMMAND',
);

export const REMOVE_RESEARCH_ANCHOR_COMMAND: LexicalCommand<RemoveAnchorPayload> = createCommand(
  'REMOVE_RESEARCH_ANCHOR_COMMAND',
);

export function ResearchAnchorPlugin() {
  const [editor] = useLexicalComposerContext();
  const { anchorMap } = useResearchAnchorContext();

  useEffect(() => {
    return mergeRegister(
      registerNestedElementResolver<MarkNode>(
        editor,
        MarkNode,
        (from) => new MarkNode(from.getIDs()),
        (from, to) => {
          for (const id of from.getIDs()) {
            to.addID(id);
          }
        },
      ),

      editor.registerCommand(
        WRAP_SELECTION_AS_RESEARCH_ANCHOR_COMMAND,
        ({ anchorId, onCreated }) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || selection.isCollapsed()) {
            return false;
          }
          const id = anchorId ?? newResearchAnchorId();
          const isBackward = selection.isBackward();
          $wrapSelectionInMarkNode(selection, isBackward, id);
          onCreated?.(id);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),

      editor.registerCommand(
        REMOVE_RESEARCH_ANCHOR_COMMAND,
        ({ anchorId }) => {
          if (!isResearchAnchorId(anchorId)) return false;
          const keys = anchorMap.get(anchorId);
          if (!keys || keys.size === 0) return true;
          for (const key of keys) {
            const node = $getNodeByKey(key);
            if ($isMarkNode(node)) {
              node.deleteID(anchorId);
              if (node.getIDs().length === 0) {
                $unwrapMarkNode(node);
              }
            }
          }
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),

      // Unwrap-on-empty listener. MarkNode.deleteID() (called e.g. from another
      // plugin) only mutates the IDs array; it does not unwrap the node when
      // empty. Mirrors CommentPlugin's pattern but filtered to research anchors
      // so we don't interfere with comment threads.
      editor.registerMutationListener(MarkNode, (mutations) => {
        const markKeysToCheck: NodeKey[] = [];
        for (const [key, mutation] of mutations) {
          if (mutation === 'updated' || mutation === 'created') {
            markKeysToCheck.push(key);
          }
        }
        if (markKeysToCheck.length === 0) return;

        editor.update(() => {
          for (const key of markKeysToCheck) {
            const node = $getNodeByKey(key);
            if (!$isMarkNode(node)) continue;
            const ids = node.getIDs();
            // Only act on marks that are *exclusively* research anchors. If a
            // mark also carries a comment thread id, leave it for the
            // CommentPlugin to manage.
            if (ids.length === 0 || !ids.every(isResearchAnchorId)) continue;

            const text = node.getTextContent();
            if (text.length === 0) {
              $unwrapMarkNode(node);
            }
          }
        });
      }),
    );
  }, [editor, anchorMap]);

  return null;
}
