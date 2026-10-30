// EXPERIMENT (experiment/iframe-layout-ronny-exp3): "Start below widget" in the editor (see WidgetClearNode):
// where the chip that adds one shows, adding it, and Backspace or Delete taking it out again.
import { $getNodeByKey, $getSelection, $isRangeSelection, $isRootNode, type LexicalEditor, type LexicalNode } from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isSentinelParagraphNode } from '@/components/editor/lexicalPlugins/blockCursorNavigation/SentinelParagraphNode';
import { EDITOR_FLOAT } from '@/components/contents/widgetNeighbours';
import { $atCaret, $contentSibling } from './widgetDeleteGuard';
import { $createWidgetClearNode, $isWidgetClearNode, type WidgetClearNode } from './WidgetClearNode';
import { WIDGET_CLEAR_CLASS } from './widgetClearClass';
import { $isIframeWidgetNode } from './IframeWidgetNode';
import { anchorOffset, editorColumnRect } from './widgetDragDom';

/**
 * The widget the text wraps around that a top-level block's element comes after, with nothing between them that
 * starts below it (no two widgets share a height, so it is the only one that can be beside the block).
 */
function floatBefore(elem: Element): HTMLElement | null {
  for (let el = elem.previousElementSibling; el; el = el.previousElementSibling) {
    if (el.matches(EDITOR_FLOAT)) return el as HTMLElement;
    if (el.matches(`.iframe-widget-code, .${WIDGET_CLEAR_CLASS}`) || getComputedStyle(el).clear !== 'none') return null;
  }
  return null;
}

/** The room the chip needs in the margin left of the column. */
const CHIP_ROOM = 110;

/**
 * Where to offer "Start below widget", in `anchorElem`'s coordinates: beside the top of the block the caret is
 * in, when that block starts beside a widget (and isn't the one the widget lines up with: starting below, it
 * would leave the widget beside nothing). Null otherwise, or while a widget is being moved.
 */
export function startBelowSpot(editor: LexicalEditor, anchorElem: HTMLElement): { key: string, top: number, left: number } | null {
  if (document.body.classList.contains('lw-widget-dragging')) return null;
  const key = editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return null;
    const block = selection.anchor.getNode().getTopLevelElement();
    if (!block || $isIframeWidgetNode(block) || $isSentinelParagraphNode(block) || $isWidgetClearNode(block)) return null;
    // (Section headings start below widgets anyway.)
    if ($isHeadingNode(block) && (block.getTag() === 'h1' || block.getTag() === 'h2')) return null;
    if ($isWidgetClearNode($contentSibling(block, 'backward'))) return null;
    return block.getKey();
  });
  const elem = key ? editor.getElementByKey(key) : null;
  const float = elem && floatBefore(elem);
  if (!key || !elem || !float) return null;
  const widget = float.getBoundingClientRect();
  const block = elem.getBoundingClientRect();
  const end = widget.bottom + (parseFloat(getComputedStyle(float).marginBottom) || 0);
  if (block.top <= widget.top + 8 || block.top >= end) return null;
  const column = editorColumnRect(editor);
  if (column.left < CHIP_ROOM) return null;
  const { dx, dy } = anchorOffset(anchorElem);
  return { key, top: Math.round(block.top + dy), left: Math.round(column.left - 8 + dx) };
}

/** Makes the top-level block `key` start below the widget beside it. */
export function $startBelow(key: string): void {
  const node = $getNodeByKey(key);
  if (node && $isRootNode(node.getParent()) && !$isWidgetClearNode($contentSibling(node, 'backward'))) {
    node.insertBefore($createWidgetClearNode());
    $removeLaterClears(node);
  }
}

/**
 * Only one "Start below widget" per widget (Ronny, Oct 30 2026): the first one after a widget already starts
 * everything after it below the widget, so another one before the next widget would do nothing. Adding one
 * above an existing one removes that one.
 */
function $removeLaterClears(from: LexicalNode): void {
  let next = from.getNextSibling();
  while (next && !$isIframeWidgetNode(next)) {
    const after: LexicalNode | null = next.getNextSibling();
    if ($isWidgetClearNode(next)) next.remove();
    next = after;
  }
}

/** A node transform: a "Start below widget" with another one before it, since the last widget, goes (a paste, say). */
export function $dropRepeatedClear(node: WidgetClearNode): void {
  for (let prev = node.getPreviousSibling(); prev && !$isIframeWidgetNode(prev); prev = prev.getPreviousSibling()) {
    if ($isWidgetClearNode(prev)) {
      node.remove();
      return;
    }
  }
}

/** Backspace at the start of the block after a "Start below widget" (Delete at the end of the one before) removes it. */
export function $removeClearAtCaret(direction: 'backward' | 'forward'): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;
  const neighbour = $atCaret(selection, direction)?.neighbour;
  if (!$isWidgetClearNode(neighbour)) return false;
  neighbour.remove();
  return true;
}
