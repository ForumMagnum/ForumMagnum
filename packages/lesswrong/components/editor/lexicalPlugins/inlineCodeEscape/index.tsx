import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_RIGHT_COMMAND,
} from 'lexical';

/**
 * Escape hatch for inline code at the end of the document. With the caret at
 * the right edge of a trailing code-format text node, the selection keeps the
 * code format, every keystroke extends the code, and ArrowRight has nowhere
 * to move — the format is inescapable. ArrowRight at that boundary clears the
 * code bit from the selection, so subsequent typing is unformatted. A
 * selection-only change: it works identically in suggesting mode (suggested
 * text takes the selection's format) and leaves no undo entry. When another
 * block follows, ArrowRight navigates into it natively instead (Slack's
 * behavior), so the escape must not fire.
 */
export default function InlineCodeEscapePlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      (event) => {
        if (!editor.isEditable()) return false;
        if (event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return false;
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;
        if (!selection.hasFormat('code')) return false;
        const anchor = selection.anchor;
        if (anchor.type !== 'text') return false;
        const node = anchor.getNode();
        if (!$isTextNode(node) || !node.hasFormat('code')) return false;
        if (anchor.offset !== node.getTextContentSize()) return false;
        const block = node.getTopLevelElementOrThrow();
        if (block.getLastDescendant()?.getKey() !== node.getKey()) return false;
        if (block.getNextSibling() !== null) return false;
        event.preventDefault();
        selection.toggleFormat('code');
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor]);

  return null;
}
