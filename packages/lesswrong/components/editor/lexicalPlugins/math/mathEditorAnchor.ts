import { $getSelection, $isRangeSelection, $isRootNode, type LexicalEditor } from 'lexical';
import { createDOMRange } from '@lexical/selection';
import type { VirtualElement } from '@floating-ui/react';

function getAnchorRect(range: Range, contextElement: HTMLElement): DOMRect {
  const rect = range.getBoundingClientRect();
  if (rect.width || rect.height) return rect;

  // Empty paragraphs can have a zero-sized range. Use that paragraph, never
  // the bottom of the entire editor, as the fallback insertion location.
  return contextElement.getBoundingClientRect();
}

/** Read after Lexical has reconciled the DOM, including removal of slash commands. */
export function $getMathEditorAnchor(editor: LexicalEditor): VirtualElement | null {
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) return null;

  const { focus } = selection;
  const node = focus.getNode();
  const contextNode = $isRootNode(node)
    ? node.getChildAtIndex(focus.offset) ?? node.getLastChild()
    : node;
  if (!contextNode) return null;
  const contextElement = editor.getElementByKey(contextNode.getKey());
  const range = createDOMRange(editor, node, focus.offset, node, focus.offset);
  if (!contextElement || !range) return null;

  // Keep a live DOM range, independent of the browser selection (which moves
  // into the equation input), so scrolling and layout changes move the anchor.
  return {
    contextElement,
    getBoundingClientRect: getAnchorRect.bind(null, range, contextElement),
  };
}
