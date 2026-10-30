// EXPERIMENT (experiment/iframe-layout-ronny-exp3): "Start below widget" in the editor (see WidgetClearNode):
// where the chip that adds one shows, adding it, Backspace or Delete taking it out again, and the hint about
// blank lines beside a widget.
import {
  $createParagraphNode, $getNodeByKey, $getRoot, $getSelection, $isParagraphNode, $isRangeSelection, $isRootNode,
  type LexicalEditor, type LexicalNode, type ParagraphNode,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isSentinelParagraphNode } from '@/components/editor/lexicalPlugins/blockCursorNavigation/SentinelParagraphNode';
import { EDITOR_CLEARING_BLOCKS, EDITOR_FLOAT } from '@/components/contents/widgetNeighbours';
import { WRAP_GUTTER } from '@/components/contents/iframeWidgetLayout';
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

/** A blank line: an empty paragraph (not a caret gap). */
function isBlank(node: LexicalNode | null | undefined): node is ParagraphNode {
  return $isParagraphNode(node) && !$isSentinelParagraphNode(node) && node.getChildrenSize() === 0;
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
    // (Blank lines get the hint instead: blankLineHints.)
    if (isBlank(block)) return null;
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

/**
 * Blank lines beside a widget, which the editor points at "Start below widget" (Ronny, Oct 30 2026: "Use Below
 * Widget to move text below a widget", shown only when someone has pressed Enter on a blank line beside a widget,
 * or has moved content below a widget with Enter). A run of blank lines that starts beside a widget gets the hint
 * when it has two lines or more, or when the block after it starts below the widget (the blank lines pushed it
 * there, which only works at this window width).
 */
export interface BlankLineHint {
  keys: string[];
  /** The block after the blank lines, or null at the end of the post. */
  nextKey: string | null;
  /** Where the hint goes, in the anchor element's coordinates: on the first blank line, beside the widget. */
  top: number;
  left: number;
  width: number;
}

export function blankLineHints(editor: LexicalEditor, anchorElem: HTMLElement): BlankLineHint[] {
  if (document.body.classList.contains('lw-widget-dragging')) return [];
  const runs = editor.getEditorState().read(() => {
    const out: Array<{ keys: string[], nextKey: string | null }> = [];
    let run: string[] = [];
    for (const child of $getRoot().getChildren()) {
      if ($isSentinelParagraphNode(child)) continue;
      if (isBlank(child)) {
        run.push(child.getKey());
        continue;
      }
      if (run.length) out.push({ keys: run, nextKey: child.getKey() });
      run = [];
    }
    if (run.length) out.push({ keys: run, nextKey: null });
    return out;
  });
  const hints: BlankLineHint[] = [];
  const column = editorColumnRect(editor);
  const { dx, dy } = anchorOffset(anchorElem);
  for (const { keys, nextKey } of runs) {
    const first = editor.getElementByKey(keys[0]);
    const float = first && floatBefore(first);
    if (!first || !float) continue;
    const widget = float.getBoundingClientRect();
    const widgetEnd = widget.bottom + (parseFloat(getComputedStyle(float).marginBottom) || 0);
    const top = first.getBoundingClientRect().top;
    if (top >= widgetEnd) continue;
    const next = nextKey ? editor.getElementByKey(nextKey) : null;
    const pushedBelow = !!next && next.getBoundingClientRect().top >= widgetEnd - 1;
    if (keys.length < 2 && !pushedBelow) continue;
    const left = getComputedStyle(float).float === 'left' ? widget.right + WRAP_GUTTER : column.left;
    const right = getComputedStyle(float).float === 'left' ? column.left + column.width : widget.left - WRAP_GUTTER;
    hints.push({ keys, nextKey, top: Math.round(top + dy), left: Math.round(left + dx), width: Math.max(0, Math.round(right - left)) });
  }
  return hints;
}

/**
 * The hint's button: the blank lines go, and what follows them starts below the widget instead. (Nothing to add
 * when that already starts below it: a section heading, a divider, an embed, a widget, or another "Start below
 * widget". At the end of the post, the caret gets a line of its own below the widget.)
 */
export function $replaceBlankLines(editor: LexicalEditor, keys: string[], nextKey: string | null): void {
  const blanks = keys.map(key => $getNodeByKey(key)).filter(isBlank);
  if (!blanks.length) return;
  const next = nextKey ? $getNodeByKey(nextKey) : null;
  const before = blanks[0];
  if (next && $isRootNode(next.getParent())) {
    const startsBelow = $isIframeWidgetNode(next) || !!editor.getElementByKey(next.getKey())?.matches(EDITOR_CLEARING_BLOCKS);
    for (const blank of blanks) blank.remove();
    if (!startsBelow) $startBelow(next.getKey());
    next.selectStart();
    return;
  }
  const line = $createParagraphNode();
  before.insertBefore($createWidgetClearNode());
  before.insertBefore(line);
  for (const blank of blanks) blank.remove();
  line.select();
}

