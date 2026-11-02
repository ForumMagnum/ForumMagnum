// EXPERIMENT (experiment/iframe-layout-ronny-exp3): "Start below widget" in the editor (see WidgetClearNode):
// where the chip that adds one shows, adding it, Backspace or Delete taking it out again, and the hint about
// blank lines beside a widget. All of it works inside the quotes, AI content and collapsible sections that flow
// beside a widget too (Ronny, Nov 2 2026: "doesn't seem to work inside ai block", "or inside quote block?").
import {
  $createParagraphNode, $getNodeByKey, $getRoot, $getSelection, $isElementNode, $isParagraphNode, $isRangeSelection,
  $isRootNode, type ElementNode, type LexicalEditor, type LexicalNode, type ParagraphNode,
} from 'lexical';
import { $isSentinelParagraphNode } from '@/components/editor/lexicalPlugins/blockCursorNavigation/SentinelParagraphNode';
import { $isContainerQuoteNode } from '@/components/editor/lexicalPlugins/quote/ContainerQuoteNode';
import { $isLLMContentBlockContentNode } from '@/components/editor/lexicalPlugins/llmContentOutput/LLMContentBlockContentNode';
import { $isCollapsibleSectionContentNode } from '@/components/editor/lexicalPlugins/collapsibleSections/CollapsibleSectionContentNode';
import { EDITOR_FLOAT } from '@/components/contents/widgetNeighbours';
import { WRAP_GUTTER } from '@/components/contents/iframeWidgetLayout';
import { $atCaret, $contentSibling } from './widgetDeleteGuard';
import { $createWidgetClearNode, $isWidgetClearNode, type WidgetClearNode } from './WidgetClearNode';
import { WIDGET_CLEAR_CLASS } from './widgetClearClass';
import { $isIframeWidgetNode } from './IframeWidgetNode';
import { anchorOffset, editorColumnRect } from './widgetDragDom';

/** Where a "Start below widget" can go: the post, and the quotes, AI content and collapsible sections in it. */
function $holdsBlocks(node: LexicalNode | null): node is ElementNode {
  return $isRootNode(node) || $isContainerQuoteNode(node) || $isLLMContentBlockContentNode(node) || $isCollapsibleSectionContentNode(node);
}

/**
 * An element that is its own box (a new formatting context: display flow-root, a table, a scroll box...). The
 * text in one doesn't wrap around a widget outside it, so neither blank lines nor a marker in it move anything
 * below that widget. A quote or collapsible section beside a left widget is one (widgetNeighbours): it starts
 * below the widget as a whole instead.
 */
function isBox(el: Element): boolean {
  const style = getComputedStyle(el);
  return style.display.includes('flow-root') || !['block', 'list-item', 'contents'].includes(style.display)
    || [style.overflowX, style.overflowY].some(overflow => overflow !== 'visible' && overflow !== 'clip')
    || style.float !== 'none' || style.position === 'absolute' || style.position === 'fixed'
    || /layout|paint|content|strict/.test(style.contain);
}

/** Whether `elem`, or anything it is in below the editor's root, is a box. */
function inBox(elem: Element | null, root: Element | null): boolean {
  for (let el = elem; el && el !== root; el = el.parentElement) {
    if (isBox(el)) return true;
  }
  return false;
}

/**
 * The widget the text wraps around that a block's element comes after (a block at any depth: in a quote, AI
 * content or a collapsible section too), with nothing between them that starts below it (no two widgets share a
 * height, so it is the only one that can be beside the block). Null in a box, which wraps around nothing.
 */
function floatBefore(elem: Element, root: Element): HTMLElement | null {
  for (let level: Element | null = elem; level && level !== root; level = level.parentElement) {
    if (level !== elem && isBox(level)) return null;
    for (let el = level.previousElementSibling; el; el = el.previousElementSibling) {
      if (el.matches(EDITOR_FLOAT)) return el as HTMLElement;
      if (el.matches(`.iframe-widget-code, .${WIDGET_CLEAR_CLASS}`) || getComputedStyle(el).clear !== 'none') return null;
    }
  }
  return null;
}

/** A blank line: an empty paragraph (not a caret gap). */
function isBlank(node: LexicalNode | null | undefined): node is ParagraphNode {
  return $isParagraphNode(node) && !$isSentinelParagraphNode(node) && node.getChildrenSize() === 0;
}

/**
 * The block a "Start below widget" for `block` goes in front of: the block itself, unless it is the first thing
 * in its quote, AI content or section (a marker there would leave the container's top beside the widget, with
 * nothing in it) or that container is a box. Then the container, and so on outwards.
 */
function $clearTarget(editor: LexicalEditor, block: LexicalNode): LexicalNode {
  const root = editor.getRootElement();
  let target = block;
  for (;;) {
    const container = target.getParent();
    const outer = container && !$isRootNode(container) ? container.getTopLevelElement() : null;
    if (!outer) return target;
    if ($holdsBlocks(container) && $contentSibling(target, 'backward') && !inBox(editor.getElementByKey(container.getKey()), root)) {
      return target;
    }
    target = outer;
  }
}

/** The room the chip needs in the margin left of the column. */
const CHIP_ROOM = 110;

/**
 * Where to offer "Start below widget", in `anchorElem`'s coordinates: beside the top of the block the caret is
 * in (or the quote, AI content or section it opens: $clearTarget), when that block starts beside a widget (and
 * isn't the one the widget lines up with: starting below, it would leave the widget beside nothing). Null
 * otherwise, or while a widget is being moved.
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
    const target = $clearTarget(editor, block);
    return $isWidgetClearNode($contentSibling(target, 'backward')) ? null : target.getKey();
  });
  const root = editor.getRootElement();
  const elem = key ? editor.getElementByKey(key) : null;
  // (Section headings, dividers and embeds start below widgets anyway.)
  const float = elem && root && getComputedStyle(elem).clear === 'none' ? floatBefore(elem, root) : null;
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

/** Makes the block `key` (at any depth) start below the widget beside it: see $clearTarget for where the marker goes. */
export function $startBelow(editor: LexicalEditor, key: string): void {
  const node = $getNodeByKey(key);
  if (!node?.getParent()) return;
  const target = $clearTarget(editor, node);
  if ($isWidgetClearNode($contentSibling(target, 'backward'))) return;
  const clear = $createWidgetClearNode();
  target.insertBefore(clear);
  $removeLaterClears(clear);
}

/** The widgets and the "Start below widget"s in the post, in order (those in quotes, AI content and sections too). */
function $widgetsAndClears(): LexicalNode[] {
  const out: LexicalNode[] = [];
  const walk = (node: LexicalNode) => {
    if ($isIframeWidgetNode(node) || $isWidgetClearNode(node)) out.push(node);
    else if ($isElementNode(node)) node.getChildren().forEach(walk);
  };
  walk($getRoot());
  return out;
}

/**
 * Only one "Start below widget" per widget (Ronny, Oct 30 2026): the first one after a widget already starts
 * everything after it below the widget, so another one before the next widget would do nothing. Adding one
 * above an existing one removes that one (also from inside a quote, AI content or section).
 */
function $removeLaterClears(clear: WidgetClearNode): void {
  const order = $widgetsAndClears();
  const at = order.findIndex(node => node.is(clear));
  if (at < 0) return;
  for (let i = at + 1; i < order.length && !$isIframeWidgetNode(order[i]); i++) order[i].remove();
}

/** A node transform: a "Start below widget" with another one before it, since the last widget, goes (a paste, say). */
export function $dropRepeatedClear(node: WidgetClearNode): void {
  const order = $widgetsAndClears();
  for (let i = order.findIndex(other => other.is(node)) - 1; i >= 0 && !$isIframeWidgetNode(order[i]); i--) {
    if ($isWidgetClearNode(order[i])) {
      node.remove();
      return;
    }
  }
}

/**
 * Backspace at the start of the block after a "Start below widget" (Delete at the end of the one before) removes
 * it, also at the start of the quote, AI content or section it is in front of (the end of one it comes after).
 */
export function $removeClearAtCaret(direction: 'backward' | 'forward'): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;
  const at = $atCaret(selection, direction);
  let neighbour = at?.neighbour ?? null;
  // (At the first or last block of a container: out to the container's own neighbour.)
  for (let block = at?.near ?? null; !neighbour && block;) {
    const container: ElementNode | null = block.getParent();
    block = container && !$isRootNode(container) ? container.getTopLevelElement() : null;
    if (block && $holdsBlocks(block.getParent())) neighbour = $contentSibling(block, direction);
  }
  if (!$isWidgetClearNode(neighbour)) return false;
  neighbour.remove();
  return true;
}

/**
 * Blank lines beside a widget, which the editor points at "Start below widget" (Ronny, Oct 30 2026: "Use Below
 * Widget to move text below a widget", shown only when someone has pressed Enter on a blank line beside a widget,
 * or has moved content below a widget with Enter). A run of blank lines that starts beside a widget gets the hint
 * when it has two lines or more, or when the block after it starts below the widget (the blank lines pushed it
 * there, which only works at this window width). Runs inside a quote, AI content or section count too.
 */
export interface BlankLineHint {
  keys: string[];
  /** The block after the blank lines (in the same quote, AI content or section), or null at the end of the post (or of that). */
  nextKey: string | null;
  /** Where the hint goes, in the anchor element's coordinates: on the first blank line, beside the widget. */
  top: number;
  left: number;
  width: number;
}

/** The quotes, AI contents and collapsible sections' contents in `node` (or `node`, when it is one). */
function $innerContainers(node: LexicalNode): ElementNode[] {
  if ($holdsBlocks(node)) return [node];
  return $isElementNode(node) && !node.isInline() ? node.getChildren().flatMap(child => $innerContainers(child)) : [];
}

export function blankLineHints(editor: LexicalEditor, anchorElem: HTMLElement): BlankLineHint[] {
  const root = editor.getRootElement();
  if (!root || document.body.classList.contains('lw-widget-dragging')) return [];
  const runs = editor.getEditorState().read(() => {
    const out: Array<{ keys: string[], nextKey: string | null }> = [];
    const scan = (container: ElementNode) => {
      let run: string[] = [];
      for (const child of container.getChildren()) {
        if ($isSentinelParagraphNode(child)) continue;
        if (isBlank(child)) {
          run.push(child.getKey());
          continue;
        }
        if (run.length) out.push({ keys: run, nextKey: child.getKey() });
        run = [];
        $innerContainers(child).forEach(scan);
      }
      if (run.length) out.push({ keys: run, nextKey: null });
    };
    scan($getRoot());
    return out;
  });
  const hints: BlankLineHint[] = [];
  const { dx, dy } = anchorOffset(anchorElem);
  for (const { keys, nextKey } of runs) {
    const first = editor.getElementByKey(keys[0]);
    // (Nothing for blank lines in a closed collapsible section.)
    const float = first?.getClientRects().length ? floatBefore(first, root) : null;
    if (!first || !float) continue;
    const widget = float.getBoundingClientRect();
    const widgetEnd = widget.bottom + (parseFloat(getComputedStyle(float).marginBottom) || 0);
    const line = first.getBoundingClientRect();
    if (line.top >= widgetEnd) continue;
    const next = nextKey ? editor.getElementByKey(nextKey) : null;
    const pushedBelow = !!next && next.getBoundingClientRect().top >= widgetEnd - 1;
    if (keys.length < 2 && !pushedBelow) continue;
    const onLeft = getComputedStyle(float).float === 'left';
    const left = onLeft ? Math.max(line.left, widget.right + WRAP_GUTTER) : line.left;
    const right = onLeft ? line.right : Math.min(line.right, widget.left - WRAP_GUTTER);
    hints.push({ keys, nextKey, top: Math.round(line.top + dy), left: Math.round(left + dx), width: Math.max(0, Math.round(right - left)) });
  }
  return hints;
}

/**
 * The hint's button: the blank lines go, and what follows them starts below the widget instead. (Nothing to add
 * when that already starts below it: a section heading, a divider, an embed, a widget, or another "Start below
 * widget". At the end of the post, or of a quote, AI content or section, the caret gets a line of its own below
 * the widget.)
 */
export function $replaceBlankLines(editor: LexicalEditor, keys: string[], nextKey: string | null): void {
  const blanks = keys.map(key => $getNodeByKey(key)).filter(isBlank);
  if (!blanks.length) return;
  const next = nextKey ? $getNodeByKey(nextKey) : null;
  if (next && $holdsBlocks(next.getParent())) {
    const elem = editor.getElementByKey(next.getKey());
    // (A block the sliver guard moved below the widget only stays there while the blank lines push it.)
    const startsBelow = $isIframeWidgetNode(next)
      || (!!elem && getComputedStyle(elem).clear !== 'none' && !elem.hasAttribute('data-lw-below'));
    for (const blank of blanks) blank.remove();
    if (!startsBelow) $startBelow(editor, next.getKey());
    next.selectStart();
    return;
  }
  const line = $createParagraphNode();
  blanks[0].insertBefore(line);
  for (const blank of blanks) blank.remove();
  $startBelow(editor, line.getKey());
  line.select();
}
