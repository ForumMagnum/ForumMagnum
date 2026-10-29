// EXPERIMENT (experiment/iframe-layout-ronny-exp2): what dragging a widget needs to read from the
// editor's DOM (editorColumnWidth moved here from IframeWidgetPlugin). Measured fresh on every
// animation frame of a drag (about 60 blocks for the demo post), so scrolling and window resizes need
// no special handling.
import { $getRoot, type LexicalEditor, type LexicalNode } from 'lexical';
import { $isHeadingNode } from '@lexical/rich-text';
import { $isFootnoteSectionNode } from '@/components/editor/lexicalPlugins/footnotes/FootnoteSectionNode';
import { $isCollapsibleSectionContainerNode } from '@/components/editor/lexicalPlugins/collapsibleSections/CollapsibleSectionContainerNode';
import { $isSentinelParagraphNode } from '@/components/editor/lexicalPlugins/blockCursorNavigation/SentinelParagraphNode';
import { $isIframeWidgetNode } from './IframeWidgetNode';
import type { BlockBox, ColumnRect } from './widgetDragGeometry';
import { EDITOR_CLEARING_BLOCKS } from '@/components/contents/widgetNeighbours';
import { widgetContainerWidth } from '@/components/contents/widgetSliverGuard';

/**
 * The next sibling that is content, skipping the empty sentinel paragraphs the editor keeps around
 * widgets for the caret (see BlockCursorNavigationPlugin).
 */
export function $nextContentSibling(node: LexicalNode): LexicalNode | null {
  let next = node.getNextSibling();
  while (next && $isSentinelParagraphNode(next)) next = next.getNextSibling();
  return next;
}

/** Width of the editor's text column, which wrapped widgets are sized against. */
export function editorColumnWidth(editor: LexicalEditor): number {
  const root = editor.getRootElement();
  if (!root) return 0;
  const cs = getComputedStyle(root);
  return root.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
}

/** The editor's text column in client coordinates (same width as editorColumnWidth). */
export function editorColumnRect(editor: LexicalEditor): ColumnRect {
  const root = editor.getRootElement();
  if (!root) return { left: 0, width: 0 };
  const cs = getComputedStyle(root);
  const paddingLeft = parseFloat(cs.paddingLeft) || 0;
  const paddingRight = parseFloat(cs.paddingRight) || 0;
  return {
    left: root.getBoundingClientRect().left + root.clientLeft + paddingLeft,
    width: root.clientWidth - paddingLeft - paddingRight,
  };
}

/**
 * EXPERIMENT (experiment/iframe-layout-ronny-exp3): the text column the widget with `key` is sized and
 * resized against: the editor's for a top-level widget, or the text of the block holding it (a quote, list
 * item, section...). Width 0 where a widget never wraps (a table cell, footnote or column).
 */
export function widgetColumnRect(editor: LexicalEditor, key: string): ColumnRect {
  const root = editor.getRootElement();
  const parent = editor.getElementByKey(key)?.parentElement;
  if (!root || !parent || parent === root) return editorColumnRect(editor);
  const cs = getComputedStyle(parent);
  return {
    left: parent.getBoundingClientRect().left + parent.clientLeft + (parseFloat(cs.paddingLeft) || 0),
    width: widgetContainerWidth(parent),
  };
}

/**
 * The post's top-level blocks up to its footnotes section (drops never go after the footnotes), with
 * their boxes and floats, plus the text column.
 */
export function measureBlocks(editor: LexicalEditor): { blocks: BlockBox[], column: ColumnRect } {
  const blocks: BlockBox[] = [];
  editor.getEditorState().read(() => {
    const children = $getRoot().getChildren();
    for (let index = 0; index < children.length; index++) {
      const child = children[index];
      if ($isFootnoteSectionNode(child)) break;
      const key = child.getKey();
      const elem = editor.getElementByKey(key);
      if (!elem) continue;
      const rect = elem.getBoundingClientRect();
      const { float, clear } = getComputedStyle(elem);
      // EXPERIMENT (experiment/iframe-layout-ronny-exp3): dividers and embeds start below a widget the text
      // wraps around, but only once one floats before them, so they're known by kind, not by their style
      // now. (A box the sliver guard moved below a widget doesn't count: that depends on where it is now.)
      const clearing = elem.matches(EDITOR_CLEARING_BLOCKS);
      blocks.push({
        key,
        index,
        kind: $isHeadingNode(child) ? 'heading'
          : $isCollapsibleSectionContainerNode(child) ? 'section'
          : $isIframeWidgetNode(child) ? 'widget'
          : $isSentinelParagraphNode(child) ? 'sentinel'
          : clearing ? (elem.matches('hr') ? 'divider' : 'embed')
          : 'other',
        float: float === 'left' || float === 'right' ? float : 'none',
        clears: clearing || (clear !== 'none' && !elem.hasAttribute('data-lw-below')),
        top: rect.top,
        bottom: rect.bottom,
      });
    }
  });
  return { blocks, column: editorColumnRect(editor) };
}

/** Adds these to client coordinates to get coordinates inside the anchor element (where overlays live). */
export function anchorOffset(anchorElem: HTMLElement): { dx: number, dy: number } {
  const rect = anchorElem.getBoundingClientRect();
  return { dx: anchorElem.scrollLeft - rect.left, dy: anchorElem.scrollTop - rect.top };
}
