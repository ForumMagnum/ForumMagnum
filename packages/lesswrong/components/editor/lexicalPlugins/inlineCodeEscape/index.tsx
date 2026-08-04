import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_RIGHT_COMMAND,
} from 'lexical';

/**
 * Escape hatch for inline code at the end of a block. With the caret at the
 * right edge of a code-format text node and nothing after it, the selection
 * keeps the code format, every keystroke extends the code, and ArrowRight has
 * nowhere to move — the format is inescapable. Match Slack: ArrowRight at
 * that boundary inserts an unformatted space after the code.
 */
export default function InlineCodeEscapePlugin({
  disabled = false,
}: {
  disabled?: boolean;
}): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (disabled) return;
    return editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      (event) => {
        if (!editor.isEditable()) return false;
        if (event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return false;
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;
        const anchor = selection.anchor;
        if (anchor.type !== 'text') return false;
        const node = anchor.getNode();
        if (!$isTextNode(node) || !node.hasFormat('code')) return false;
        if (anchor.offset !== node.getTextContentSize()) return false;
        if (node.getNextSibling() !== null) return false;
        event.preventDefault();
        const spacer = $createTextNode(' ');
        node.insertAfter(spacer);
        spacer.select(1, 1);
        return true;
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, disabled]);

  return null;
}
