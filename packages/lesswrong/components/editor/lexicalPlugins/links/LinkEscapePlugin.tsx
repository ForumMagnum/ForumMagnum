import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isAutoLinkNode, $isLinkNode } from '@lexical/link';
import { mergeRegister } from '@lexical/utils';
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
} from 'lexical';
import { useEffect } from 'react';

/**
 * Allows the cursor to escape from inline link nodes when pressing
 * ArrowRight at the end of a link or ArrowLeft at the start. Without this,
 * the cursor gets trapped and subsequent typing extends the link.
 */
export default function LinkEscapePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_ARROW_RIGHT_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchor = selection.anchor;
          const anchorNode = anchor.getNode();

          if (!$isTextNode(anchorNode)) {
            return false;
          }
          if (anchor.offset !== anchorNode.getTextContentSize()) {
            return false;
          }

          const parent = anchorNode.getParent();
          if ((!$isLinkNode(parent) && !$isAutoLinkNode(parent)) || anchorNode.getNextSibling() !== null) {
            return false;
          }

          const linkNextSibling = parent.getNextSibling();
          if ($isTextNode(linkNextSibling)) {
            linkNextSibling.select(0, 0);
          } else {
            const emptyText = $createTextNode('');
            parent.insertAfter(emptyText);
            emptyText.select(0, 0);
          }

          event?.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),

      editor.registerCommand(
        KEY_ARROW_LEFT_COMMAND,
        (event) => {
          const selection = $getSelection();
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
            return false;
          }

          const anchor = selection.anchor;
          const anchorNode = anchor.getNode();

          if (!$isTextNode(anchorNode)) {
            return false;
          }
          if (anchor.offset !== 0) {
            return false;
          }

          const parent = anchorNode.getParent();
          if ((!$isLinkNode(parent) && !$isAutoLinkNode(parent)) || anchorNode.getPreviousSibling() !== null) {
            return false;
          }

          const linkPrevSibling = parent.getPreviousSibling();
          if ($isTextNode(linkPrevSibling)) {
            const textLength = linkPrevSibling.getTextContentSize();
            linkPrevSibling.select(textLength, textLength);
          } else {
            const emptyText = $createTextNode('');
            parent.insertBefore(emptyText);
            emptyText.select(0, 0);
          }

          event?.preventDefault();
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return null;
}
