// EXPERIMENT (experiment/iframe-layout-ronny-exp3): Backspace and Delete never delete or change a widget
// from a text caret or the caret gap next to it (Ronny, Oct 29 2026: "No widget should ever be deleted if
// I hit backspace unless I actively have it selected by having clicked on it. If my cursor is on text, it
// should never delete a widget."). Before, Backspace at the start of the paragraph after a widget stepped
// into the gap after it and a second Backspace deleted it (BlockCursorNavigationPlugin); inside a quote,
// list item or collapsible section (no gaps there) it merged the paragraph into the widget's hidden code,
// or emptied it.
//
// At a widget the keys join the text blocks on either side of it instead, as they would with no widget
// there: the second block's text goes onto the end of the first, with the caret where they meet. A widget
// that floats (left or right) then sits in front of the joined block, so it stays beside that text (and one
// lined up with the end of its paragraph still is); a full-width one sits after it. When one side is an
// empty paragraph, that paragraph just goes. Where the two sides aren't both paragraphs or headings (a list,
// a quote, the edge of a block that holds the widget), the key does nothing. A text selection that runs
// across a widget still deletes it: it was selected.
//
// A widget is deleted on purpose by clicking its grip (which selects it: it gets a ring) and pressing
// Backspace or Delete (Ronny, Oct 29 2026: "Grip, then Delete"). See $deleteWidget. (Widgets never sit
// inside other blocks: IframeWidgetPlugin's $hoistWidget moves them out; the guard still handles one there.)
import {
  $getNodeByKey, $getSelection, $isElementNode, $isParagraphNode, $isRangeSelection, $isRootOrShadowRoot,
  $isTextNode, type ElementNode, type LexicalNode, type RangeSelection,
} from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isSentinelParagraphNode } from '@/components/editor/lexicalPlugins/blockCursorNavigation/SentinelParagraphNode';
import { $reconcileSentinels } from '@/components/editor/lexicalPlugins/blockCursorNavigation/BlockCursorNavigationPlugin';
import { parseIframeWidgetLayout } from '@/components/contents/iframeWidgetLayout';
import { $isIframeWidgetNode, type IframeWidgetNode } from './IframeWidgetNode';

type Direction = 'backward' | 'forward';

const step = (node: LexicalNode, direction: Direction) =>
  direction === 'backward' ? node.getPreviousSibling() : node.getNextSibling();

/** The sibling before or after `node`, skipping the caret gaps (sentinel paragraphs). */
export function $contentSibling(node: LexicalNode, direction: Direction): LexicalNode | null {
  let sibling = step(node, direction);
  while (sibling && $isSentinelParagraphNode(sibling)) sibling = step(sibling, direction);
  return sibling;
}

/** A block these keys may join with another: a paragraph (not a caret gap) or a heading. */
function $isJoinable(node: LexicalNode | null): node is ElementNode {
  return !!node && (($isParagraphNode(node) && !$isSentinelParagraphNode(node)) || $isHeadingNode(node));
}

/**
 * What the key at this collapsed caret runs into (`neighbour`), and the block on the caret's own side of it
 * (`near`: the block whose edge the caret is at; for a caret gap, the block on the gap's far side; null when
 * the caret is inside a block that holds the widget). Null when the key stays inside text.
 */
export function $atCaret(selection: RangeSelection, direction: Direction): { neighbour: LexicalNode | null, near: LexicalNode | null } | null {
  const anchor = selection.anchor;
  let node: LexicalNode = anchor.getNode();
  const gap = $isSentinelParagraphNode(node) ? node : $isSentinelParagraphNode(node.getParent()) ? node.getParent() : null;
  if (gap) {
    return { neighbour: $contentSibling(gap, direction), near: $contentSibling(gap, direction === 'backward' ? 'forward' : 'backward') };
  }
  if (anchor.type === 'text') {
    if (direction === 'backward' ? anchor.offset > 0 : anchor.offset < node.getTextContentSize()) return null;
  } else if ($isElementNode(node)) {
    if (direction === 'backward' ? anchor.offset > 0 : anchor.offset < node.getChildrenSize()) {
      return { neighbour: node.getChildAtIndex(direction === 'backward' ? anchor.offset - 1 : anchor.offset), near: null };
    }
    if (!node.isInline()) return { neighbour: $contentSibling(node, direction), near: node };
  }
  // Out of inline wrappers (links and the like) while at their edge.
  for (;;) {
    const sibling = step(node, direction);
    if (sibling) return { neighbour: sibling, near: null };
    const parent = node.getParent();
    if (!parent || $isRootOrShadowRoot(parent)) return null;
    if (!parent.isInline()) return { neighbour: $contentSibling(parent, direction), near: parent };
    node = parent;
  }
}

function floats(widget: IframeWidgetNode): boolean {
  const { position } = parseIframeWidgetLayout(widget.getTextContent());
  return position === 'left' || position === 'right';
}

/** Puts `second`'s text onto the end of `first`, moving the widgets between them beside the joined block. */
function $joinAcross(first: ElementNode, second: ElementNode, widgets: IframeWidgetNode[]): void {
  const end = first.getLastDescendant();
  const size = first.getChildrenSize();
  first.append(...second.getChildren());
  second.remove();
  let after: LexicalNode = first;
  for (const widget of [...widgets].sort((a, b) => (a.isBefore(b) ? -1 : 1))) {
    if (floats(widget)) {
      first.insertBefore(widget);
    } else {
      after.insertAfter(widget);
      after = widget;
    }
  }
  if ($isTextNode(end) && end.isAttached()) end.select(end.getTextContentSize(), end.getTextContentSize());
  else first.select(size, size);
}

/**
 * Deletes the widget `key` on purpose (its grip selected, then Backspace or Delete):
 * one undo step. The caret goes to the text next to where it was, so the editor has it and the undo is a
 * keypress away.
 */
export function $deleteWidget(key: string): void {
  const node = $getNodeByKey(key);
  if (!$isIframeWidgetNode(node)) return;
  const after = $contentSibling(node, 'forward');
  const before = $contentSibling(node, 'backward');
  node.remove();
  $reconcileSentinels();
  if ($isJoinable(after) && after.isAttached()) after.selectStart();
  else if ($isJoinable(before) && before.isAttached()) before.selectEnd();
}

/**
 * For Backspace (`backward`) and Delete (`forward`): true when the key would have deleted or changed a
 * widget, having joined the text around it instead (or done nothing); false to leave the key alone.
 * `join: false` (suggestion mode) only stops the key.
 */
export function $guardWidgetsFromDeleteKey(direction: Direction, join: boolean): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;
  const at = $atCaret(selection, direction);
  if (!at || !$isIframeWidgetNode(at.neighbour)) return false;
  // The widgets in a row (with the gaps between them), and the block past them.
  const widgets: IframeWidgetNode[] = [];
  let beyond: LexicalNode | null = at.neighbour;
  while ($isIframeWidgetNode(beyond)) {
    widgets.push(beyond);
    beyond = $contentSibling(beyond, direction);
  }
  if (!join || !$isJoinable(at.near) || !$isJoinable(beyond)) return true;
  const [first, second] = direction === 'backward' ? [beyond, at.near] : [at.near, beyond];
  if (first.isEmpty() || second.isEmpty()) {
    // An empty paragraph on one side just goes, and nothing moves.
    if (first.isEmpty()) {
      first.remove();
      second.selectStart();
    } else {
      second.remove();
      first.selectEnd();
    }
  } else {
    $joinAcross(first, second, widgets);
  }
  $reconcileSentinels();
  return true;
}
