import {
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  type TextNode,
} from 'lexical';
import { $getMarkIDs } from '@lexical/mark';

function getTextFromInsertionPayload(eventOrText: InputEvent | string): string | null {
  if (typeof eventOrText === 'string') {
    return eventOrText;
  }
  if (eventOrText.dataTransfer) {
    return null;
  }
  return eventOrText.data || null;
}

function getSharedMarkIdAtRangeBoundaries(
  node: TextNode,
  startOffset: number,
  endOffset: number,
): string | null {
  const startMarkIds = $getMarkIDs(node, startOffset);
  const endMarkIds = $getMarkIDs(node, endOffset);
  if (!startMarkIds || !endMarkIds) {
    return null;
  }
  return startMarkIds.find((id) => endMarkIds.includes(id)) ?? null;
}

/**
 * Lexical's default replacement path can split a MarkNode boundary by inserting
 * the replacement text just outside the mark. For comment anchors, replacing a
 * selected character inside a marked span should keep the replacement inside the
 * same anchor.
 */
export function $replaceTextInsideCommentMark(eventOrText: InputEvent | string): boolean {
  const text = getTextFromInsertionPayload(eventOrText);
  if (!text) {
    return false;
  }

  const selection = $getSelection();
  if (!$isRangeSelection(selection) || selection.isCollapsed()) {
    return false;
  }

  const anchor = selection.anchor;
  const focus = selection.focus;
  if (anchor.type !== 'text' || focus.type !== 'text' || anchor.key !== focus.key) {
    return false;
  }

  const node = anchor.getNode();
  if (!$isTextNode(node)) {
    return false;
  }

  const startOffset = Math.min(anchor.offset, focus.offset);
  const endOffset = Math.max(anchor.offset, focus.offset);
  if (!getSharedMarkIdAtRangeBoundaries(node, startOffset, endOffset)) {
    return false;
  }

  const existingText = node.getTextContent();
  node.setTextContent(
    `${existingText.slice(0, startOffset)}${text}${existingText.slice(endOffset)}`,
  );
  node.select(startOffset + text.length, startOffset + text.length);
  return true;
}
