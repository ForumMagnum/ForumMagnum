'use client';
import React, { type JSX, useState, useEffect, useCallback, useMemo, useRef, useLayoutEffect, useContext } from 'react';
import { createPortal } from 'react-dom';

import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$insertNodeToNearestRoot, IS_APPLE, mergeRegister} from '@lexical/utils';
import {
  $addUpdateTag,
  $getEditor,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $createTextNode,
  $isLineBreakNode,
  $isElementNode,
  $isRangeSelection,
  $isRootNode,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_NORMAL,
  createCommand,
  DELETE_CHARACTER_COMMAND,
  DELETE_LINE_COMMAND,
  DELETE_WORD_COMMAND,
  HISTORY_PUSH_TAG,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  isExactShortcutMatch,
  LexicalCommand,
  LexicalEditor,
  type LexicalNode,
  REDO_COMMAND,
  SKIP_DOM_SELECTION_TAG,
  SKIP_SCROLL_INTO_VIEW_TAG,
  UNDO_COMMAND,
} from 'lexical';
import {useMessages} from '@/components/common/withMessages';
import { randomId } from '@/lib/random';

import {$createIframeWidgetNode, $isIframeWidgetNode, IframeWidgetNode} from './IframeWidgetNode';
import { alignFloatBottom, alignedParagraph } from '@/components/contents/bottomAlign';
import { widgetNeighbourGlobals } from '@/components/contents/widgetNeighbours';
import { CARET_BESIDE_ATTR, WIDGET_LAYOUT_EVENT, mayRealignAfterGuard, scheduleSliverGuard } from '@/components/contents/widgetSliverGuard';
import {
  alignOf, IframeWidgetLayout, IframeWidgetPosition, MIN_TEXT_BESIDE_WIDGET, offeredWidths,
  parseIframeWidgetLayout, sameLayout, setIframeWidgetLayout, shouldWrapWidget, stripIframeWidgetLayout,
  widgetWidthPx, wrappableWidths, WRAP_GUTTER,
} from '@/components/contents/iframeWidgetLayout';
import {
  injectResizeScript, clampIframeHeight, IFRAME_DEFAULT_HEIGHT, type IframeWidgetFit, readIframeWidgetFit,
} from './iframeResizeScript';
import {defineStyles, useStyles} from '@/components/hooks/useStyles';
import ForumIcon from '@/components/common/ForumIcon';
import { CodeIcon } from '../../icons/CodeIcon';
import classNames from 'classnames';
import { $isFootnoteSectionNode } from '@/components/editor/lexicalPlugins/footnotes/FootnoteSectionNode';
import { $reconcileSentinels } from '@/components/editor/lexicalPlugins/blockCursorNavigation/BlockCursorNavigationPlugin';
import { $isSentinelParagraphNode, SentinelParagraphNode } from '@/components/editor/lexicalPlugins/blockCursorNavigation/SentinelParagraphNode';
import { IframeWidgetDragContext } from './widgetDragContext';
import { OPTIONS_MENU_WIDTH, WidgetOptionsMenu } from './WidgetOptionsMenu';
import { $deleteWidget, $guardWidgetsFromDeleteKey } from './widgetDeleteGuard';
import { $nextContentSibling, anchorOffset, editorColumnRect, editorColumnWidth, measureBlocks } from './widgetDragDom';
import {
  adjacentSlot, type BlockBox, chooseDropSlot, type ColumnRect, type DropSlot, fitMatchesWidth, insertionKey, moveChipText,
  resizeChipText, resizeTarget, type ResizeTarget, shrinkWarning, sideLabel, stepWidth, widgetSide, type WidgetSide,
} from './widgetDragGeometry';
import { type GesturePoint, startPointerGesture, visibleBottom } from './widgetGesture';
import {
  type DragChip, type DragView, DragViewStore, type MoveDragView, primaryTint, SHRINK_WARNING_COLORS, WidgetDragLayer,
} from './WidgetDragLayer';

export const INSERT_IFRAME_WIDGET_COMMAND: LexicalCommand<string | undefined> = createCommand(
  'INSERT_IFRAME_WIDGET_COMMAND',
);

// EXPERIMENT (experiment/iframe-layout-ronny-exp2): moves a widget among the post's top-level blocks
// and/or sets its layout, as one undo step, without reloading its iframe (Lexical keeps the element).
// beforeKey: the top-level block it goes before, or null for the end of the post (before any
// footnotes); leave it out to keep the widget where it is. Used by dragging and the grip's keys.
export type MoveIframeWidgetPayload = {
  key: string,
  beforeKey?: string | null,
  layout?: IframeWidgetLayout,
};

export const MOVE_IFRAME_WIDGET_COMMAND: LexicalCommand<MoveIframeWidgetPayload> = createCommand(
  'MOVE_IFRAME_WIDGET_COMMAND',
);

/**
 * EXPERIMENT (experiment/iframe-layout-ronny-exp2): one of the post's own top-level blocks, which is
 * what dragging moves widgets among (not one inside columns, a table, a collapsible or a footnote).
 */
function $isTopLevelBlock(node: LexicalNode | null | undefined): node is LexicalNode {
  return !!node && $isRootNode(node.getParent());
}

/**
 * EXPERIMENT (experiment/iframe-layout-ronny-exp3): widgets never sit inside another block (Ronny, Oct 29
 * 2026: "get rid of any functionality for putting widgets inside of other content blocks... use the beside
 * a widget interactions"). One that lands in a quote, list item, collapsible section, AI content, table,
 * column or footnote (pasted, imported or inserted there) moves out to just before the post's block that
 * holds it, where that block sits beside it like any other. A node transform: it runs in the same update.
 */
function $hoistWidget(node: IframeWidgetNode): void {
  let top: LexicalNode = node;
  for (let parent = top.getParent(); parent && !$isRootNode(parent); parent = top.getParent()) top = parent;
  if (top.is(node) || !$isRootNode(top.getParent())) return;
  top.insertBefore(node);
}

function $moveIframeWidget({ key, beforeKey, layout }: MoveIframeWidgetPayload): boolean {
  const node = $getNodeByKey(key);
  if (!$isIframeWidgetNode(node)) return false;
  const root = $getRoot();
  let moved = false;
  let relaid = false;
  // Where it already is, the empty caret sentinels around widgets (see below) don't count.
  const next = $nextContentSibling(node);
  if (beforeKey !== undefined && beforeKey !== key) {
    // A widget inside another block stays there: taking it out would leave that block empty.
    if (!$isTopLevelBlock(node)) return false;
    if (beforeKey === null) {
      const footnotes = root.getChildren().find($isFootnoteSectionNode);
      if (footnotes) {
        if (!next?.is(footnotes)) {
          footnotes.insertBefore(node);
          moved = true;
        }
      } else if (next !== null) {
        root.append(node);
        moved = true;
      }
    } else {
      const target = $getNodeByKey(beforeKey);
      // The block went away (or isn't top-level): leave everything as it is.
      if (!$isTopLevelBlock(target)) return false;
      if (!next?.is(target)) {
        target.insertBefore(node);
        moved = true;
      }
    }
  }
  if (layout) {
    const html = node.getTextContent();
    if (!sameLayout(layout, parseIframeWidgetLayout(html))) {
      node.clear();
      node.append($createTextNode(setIframeWidgetLayout(html, layout)));
      relaid = true;
    }
  }
  if (!moved && !relaid) return true;
  // Put the caret sentinels back around the widget here, in this update, rather than in the
  // BlockCursorNavigationPlugin's follow-up one, which would re-apply the DOM selection (focusing the
  // editor, and maybe scrolling to the caret).
  if (moved && $getEditor().hasNodes([SentinelParagraphNode])) {
    $reconcileSentinels();
  }
  // A caret inside the widget's hidden code would drag the page to it.
  const selection = $getSelection();
  if ($isRangeSelection(selection) && [selection.anchor, selection.focus].some((point) => {
    const pointNode = point.getNode();
    return pointNode.is(node) || node.isParentOf(pointNode);
  })) {
    $setSelection(null);
  }
  $addUpdateTag(HISTORY_PUSH_TAG);
  $addUpdateTag(SKIP_SCROLL_INTO_VIEW_TAG);
  $addUpdateTag(SKIP_DOM_SELECTION_TAG);
  return true;
}

// EXPERIMENT (experiment/iframe-layout-ronny-exp2): the editor's own undo and redo shortcuts (Lexical's
// isUndo and isRedo, which it doesn't export), for keys pressed on a widget's grip.
const CONTROL_OR_META = { ctrlKey: !IS_APPLE, metaKey: IS_APPLE };

function isUndoShortcut(event: KeyboardEvent): boolean {
  return isExactShortcutMatch(event, 'z', CONTROL_OR_META);
}

function isRedoShortcut(event: KeyboardEvent): boolean {
  return IS_APPLE
    ? isExactShortcutMatch(event, 'z', { metaKey: true, shiftKey: true })
    : isExactShortcutMatch(event, 'y', { ctrlKey: true }) || isExactShortcutMatch(event, 'z', { ctrlKey: true, shiftKey: true });
}

const PREVIEW_MODE_CLASS = 'iframe-widget-preview-mode';

function updateWidgetGutter(key: string, editor: LexicalEditor): void {
  const element = editor.getElementByKey(key);
  if (!element) return;
  editor.getEditorState().read(() => {
    const node = $getNodeByKey(key);
    if (!node || !$isElementNode(node)) return;
    const children = node.getChildren();
    let gutter = '1';
    let count = 1;
    for (const child of children) {
      if ($isLineBreakNode(child)) {
        gutter += '\n' + ++count;
      }
    }
    element.setAttribute('data-gutter', gutter);
    element.style.setProperty('--gutter-chars', String(String(count).length));
  });
}

// EXPERIMENT (experiment/iframe-layout-ronny-exp2): width of the strip along a widget's edge that resizes
// it. The placement bar and the code toggle sit 2px further in from an edge that has one.
const RESIZE_EDGE_WIDTH = 12;
// EXPERIMENT (experiment/iframe-layout-ronny-exp2): after a drop, the page is scrolled to put the widget
// where the preview showed it if it landed further away than this (px). After a keyboard move the
// widget is scrolled to at least this far below the top of the window (clear of the site header).
const DROP_SCROLL_TOLERANCE = 24;
const KEY_MOVE_TOP_ROOM = 72;

const styles = defineStyles('IframeWidgetPlugin', (theme: ThemeType) => ({
  toggleButton: {
    position: 'absolute',
    zIndex: 2,
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.palette.grey[200],
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    color: theme.palette.grey[800],
    opacity: 0.6,
    '&:hover': {
      background: theme.palette.grey[300],
      opacity: 0.8,
    },
  },
  previewOverlay: {
    position: 'absolute',
    zIndex: 1,
    // EXPERIMENT (experiment/iframe-layout-ronny): clear like the published widget; the outline and
    // the placement bar show while the widget is hovered (or the bar has focus).
    border: '1px solid transparent',
    borderRadius: 4,
    overflow: 'hidden',
    background: 'transparent',
    transition: 'border-color 0.15s',
    '&:hover': {
      borderColor: theme.palette.greyAlpha(0.2),
    },
    '&:hover $layoutBar': {
      opacity: 1,
    },
  },
  iframe: {
    display: 'block',
    width: '100%',
    border: 'none',
  },
  emptyPreview: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    color: theme.palette.grey[500],
    fontStyle: 'italic',
    fontFamily: 'sans-serif',
  },
  icon: {
    width: 16,
    height: 16,
  },
  // EXPERIMENT (experiment/iframe-layout-ronny): placement controls on each widget preview.
  layoutBar: {
    position: 'absolute',
    zIndex: 2,
    top: 4,
    left: 4,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 2,
    maxWidth: 'calc(100% - 44px)',
    padding: 2,
    background: theme.palette.panelBackground.default,
    border: theme.palette.greyBorder('1px', 0.15),
    borderRadius: 6,
    boxShadow: `0 1px 4px ${theme.palette.boxShadowColor(0.1)}`,
    ...theme.typography.body2,
    fontSize: 12,
    opacity: 0,
    transition: 'opacity 0.15s',
    '&:focus-within': {
      opacity: 1,
    },
  },
  layoutButton: {
    padding: '3px 7px',
    border: 'none',
    borderRadius: 4,
    background: 'transparent',
    color: theme.palette.text.normal,
    cursor: 'pointer',
    font: 'inherit',
    '&:hover': {
      background: theme.palette.grey[200],
    },
  },
  layoutButtonActive: {
    background: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    '&:hover': {
      background: theme.palette.primary.main,
    },
  },
  layoutDivider: {
    width: 1,
    alignSelf: 'stretch',
    margin: '2px 3px',
    background: theme.palette.grey[300],
  },
  layoutNote: {
    padding: '3px 6px',
    color: theme.palette.grey[600],
    whiteSpace: 'nowrap',
  },
  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): drag-to-place controls, on the Experiment 2 demo
  // editor only (see IframeWidgetDragContext): a grip tab on the top edge, resize edges, a bar grip.
  // The keyboard focus shows them too, but not a focus the page moved (to the grip after a drag, for
  // undo) or a mouse click left: those match :focus-within but not :focus-visible.
  dragMode: {
    '&:hover $gripTab, &:has(:focus-visible) $gripTab': {
      opacity: 1,
    },
    '&:hover $resizeEdge': {
      opacity: 1,
    },
    '&:has(:focus-visible) $layoutBar': {
      opacity: 1,
    },
    // Below the grip tab, clear of the widget's first line (usually its title).
    '& $layoutBar': {
      top: 22,
    },
    // While the controls show, the grip tab shows whole across the top edge, and the placement bar of
    // a short or narrow widget (which wraps onto more rows than fit) runs past the widget's bottom, over
    // its neighbours, instead of being cut off. Hidden, it stays clipped, so it never catches clicks
    // meant for the text below.
    '&:hover, &:has(:focus-visible), &:has($layoutBar:focus-within)': {
      overflow: 'visible',
      zIndex: 2,
    },
    // EXPERIMENT (experiment/iframe-layout-ronny-exp3): a widget whose grip was clicked is selected: it gets
    // a ring, and Backspace or Delete removes it (the only keys that delete a widget; widgetDeleteGuard.ts).
    '&:has($gripTab:focus)': {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 2,
      overflow: 'visible',
      zIndex: 2,
    },
    '&:has($gripTab:focus) $gripTab': {
      opacity: 1,
    },
  },
  // The first-run hint shows the grip tab without hover: whole, across the top edge.
  overlayHint: {
    overflow: 'visible',
  },
  // While this widget's grip or edge is pressed, its controls stay as they were under the pointer.
  controlsPinned: {
    borderColor: theme.palette.greyAlpha(0.2),
    overflow: 'visible',
    zIndex: 2,
    '& $gripTab, & $layoutBar, & $resizeEdge': {
      opacity: 1,
    },
  },
  // The widget being moved stays where it is, faded, until it's dropped.
  overlayMoving: {
    opacity: 0.35,
    outline: `2px dashed ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): the gear button while its menu is open.
  gearOpen: {
    opacity: 1,
    background: theme.palette.grey[300],
  },
  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): just under the widget (in the margin below it, clear
  // of the widget's own text and of the post's), when its width leaves it too small (shrinkWarning).
  shrinkWarning: {
    ...theme.typography.body2,
    position: 'absolute',
    zIndex: 3,
    boxSizing: 'border-box',
    height: 16,
    padding: '0 6px',
    borderRadius: 8,
    border: `1px solid ${SHRINK_WARNING_COLORS.border}`,
    background: SHRINK_WARNING_COLORS.background,
    color: SHRINK_WARNING_COLORS.text,
    fontSize: 10.5,
    lineHeight: '14px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    pointerEvents: 'none',
  },
  // Across the widget's top edge, so it doesn't cover the widget's own text (its title, usually).
  gripTab: {
    position: 'absolute',
    zIndex: 3,
    top: -7,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 40,
    height: 14,
    padding: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    borderRadius: 7,
    border: theme.palette.greyBorder('1px', 0.2),
    background: theme.palette.panelBackground.default,
    boxShadow: `0 1px 3px ${theme.palette.boxShadowColor(0.12)}`,
    cursor: 'grab',
    touchAction: 'none',
    opacity: 0,
    transition: 'opacity 0.15s',
    '&:focus-visible': {
      opacity: 1,
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: 1,
    },
    // Touch screens can't hover, so the grip always shows there, faintly, inside the (clipped) frame.
    '@media (hover: none)': {
      opacity: 0.6,
      top: 2,
    },
  },
  // Until the first drag, the first widget's grip shows without hover and pulses three times.
  gripHint: {
    opacity: '1 !important',
    borderColor: theme.palette.primary.main,
    animation: '$lwGripPulse 1.2s ease-out 3',
  },
  '@keyframes lwGripPulse': {
    '0%': {
      boxShadow: `0 0 0 0 ${primaryTint(theme, 0.5)}`,
    },
    '70%': {
      boxShadow: `0 0 0 6px ${primaryTint(theme, 0)}`,
    },
    '100%': {
      boxShadow: `0 0 0 0 ${primaryTint(theme, 0)}`,
    },
  },
  // Six dots, three across and two down.
  gripDots: {
    display: 'block',
    width: 15,
    height: 8,
    backgroundImage: `radial-gradient(circle, ${theme.palette.grey[600]} 1.1px, transparent 1.6px)`,
    backgroundSize: '5px 4px',
    pointerEvents: 'none',
  },
  // Above the iframe. The placement bar and the code toggle are moved in to keep clear of it (see
  // RESIZE_EDGE_WIDTH). A swipe up or down on it still scrolls the page; only a sideways pull resizes.
  resizeEdge: {
    position: 'absolute',
    zIndex: 1,
    top: 0,
    bottom: 0,
    width: RESIZE_EDGE_WIDTH,
    cursor: 'ew-resize',
    touchAction: 'pan-y',
    opacity: 0,
    transition: 'opacity 0.15s',
    '&::after': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: 4,
      width: 4,
      height: 32,
      marginTop: -16,
      borderRadius: 2,
      background: theme.palette.grey[500],
    },
    '@media (hover: none)': {
      opacity: 0.6,
    },
  },
  '@global': {
    // EXPERIMENT (experiment/iframe-layout-ronny-exp3): how each kind of block behaves next to a widget the
    // text wraps around, from the same table as the post's rules.
    ...widgetNeighbourGlobals('editor'),
    // EXPERIMENT (experiment/iframe-layout-ronny-exp2): while a widget is dragged or resized (see
    // widgetGesture.ts), nothing gets selected, scroll anchoring doesn't jump, iframes don't take the
    // pointer, and the other controls step aside.
    'body.lw-widget-dragging': {
      userSelect: 'none',
      overflowAnchor: 'none',
    },
    'body.lw-widget-dragging iframe': {
      pointerEvents: 'none',
    },
    'body.lw-widget-dragging .lw-widget-control': {
      visibility: 'hidden',
    },
    // The site header slides back in whenever the page scrolls up, which a drag's auto-scroll does,
    // and would then cover the top of the window: the drop line, the chip and the slots under it.
    // It stays tucked away until the drag ends (see .headroom--pinned in Header).
    'body.lw-widget-dragging .headroom--pinned': {
      transform: 'translateY(-100%)',
    },
    // On the Experiment 2 page a full-width widget goes below any float before it, as the 100%-wide
    // iframe does in the post (instead of its preview covering the float).
    '[data-lw-widget-drag] .iframe-widget-preview-mode:not([data-lw-wraps])': {
      clear: 'both',
    },
    // A float dropped at the very end stays inside the editor.
    '[data-lw-widget-drag] [data-lexical-editor]': {
      display: 'flow-root',
    },
  },
}));

const LAYOUT_POSITIONS: Array<{ position: IframeWidgetPosition, label: string }> = [
  { position: 'inline', label: 'Full width' },
  { position: 'left', label: 'Left' },
  { position: 'right', label: 'Right' },
];
const DEFAULT_WRAP_WIDTH = '33%';

interface WidgetState {
  viewMode: 'code' | 'preview';
  previewHeight: number;
  htmlContent: string;
  layout: IframeWidgetLayout;
  widgetId: string | null;
  /** EXPERIMENT (experiment/iframe-layout-ronny-exp2): a top-level block, so it can be dragged. */
  topLevel: boolean;
  /** EXPERIMENT (experiment/iframe-layout-ronny-exp2): how small its frame last said it shows (drag editor). */
  fit?: IframeWidgetFit | null;
}

// EXPERIMENT (experiment/iframe-layout-ronny-exp2): a pressed grip or edge, then the drag it starts.
type GesturePhase = 'pressed' | 'moving' | 'resizing';

/**
 * Floats the preview spacer the way the post will float the widget, so the editor's text wraps
 * around it (the preview overlay follows the spacer's box). Code view is always full width.
 */
function placeSpacer(elem: HTMLElement, layout: IframeWidgetLayout | null, columnWidth: number): void {
  const wraps = !!layout && shouldWrapWidget(layout, columnWidth);
  const side = layout?.position === 'left' ? 'left' : 'right';
  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): a centered widget (hand-written meta only) shows at its
  // width in a row of its own, as in the post (which shows it full width on phones).
  const centered = !wraps && layout?.position === 'center' && !!layout.width && columnWidth > 0 && window.innerWidth >= 600;
  elem.style.float = wraps ? side : '';
  elem.style.clear = wraps ? side : centered ? 'both' : '';
  elem.style.width = wraps ? `${widgetWidthPx(layout!, columnWidth)}px` : centered ? `${widgetWidthPx(layout!, columnWidth)}px` : '';
  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): a full-width widget has no margin of its own, as in the
  // post (the code block's 8px showed inside a list item, or next to a quote). The code view keeps it.
  elem.style.margin = wraps ? (side === 'left' ? `6px ${WRAP_GUTTER}px 16px 0` : `6px 0 16px ${WRAP_GUTTER}px`)
    : centered ? '0 auto' : layout ? '0' : '';
  elem.toggleAttribute('data-lw-wraps', wraps);
  if (wraps) elem.dataset.lwSide = side;
  else delete elem.dataset.lwSide;
  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): align=bottom pushes it down beside the end of its
  // paragraph (see bottomAlign); otherwise any push from before goes (the margin above is set again).
  const lastPush = elem.dataset.lwBottomPush;
  elem.style.shapeOutside = '';
  delete elem.dataset.lwBottomPush;
  elem.removeAttribute('data-lw-pushed');
  if (wraps && alignOf(layout!) === 'bottom') {
    // (Starting from the last push, which is usually still right.)
    if (lastPush) elem.dataset.lwBottomPush = lastPush;
    alignFloatBottom(elem, alignedParagraph(elem), 6);
  }
}

/** EXPERIMENT (experiment/iframe-layout-ronny-exp3): whether the caret is in a sentinel (the gap between two blocks). */
function $selectionInSentinel(): boolean {
  const selection = $getSelection();
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;
  const node = selection.anchor.getNode();
  return $isSentinelParagraphNode(node) || $isSentinelParagraphNode(node.getParent());
}

function stripDeletedMarkupFromSrcdoc(srcdoc: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(srcdoc, 'text/html');
  doc.querySelectorAll('del').forEach((node) => node.remove());
  return doc.documentElement.innerHTML;
}

function applyPreviewModeToDOM(
  editor: LexicalEditor,
  nodeKey: string,
  previewHeight: number,
  layout: IframeWidgetLayout,
): void {
  const elem = editor.getElementByKey(nodeKey);
  if (!elem) return;
  elem.classList.add(PREVIEW_MODE_CLASS);
  elem.dataset.view = 'preview';
  elem.style.height = `${previewHeight}px`;
  placeSpacer(elem, layout, editorColumnWidth(editor));
  scheduleSliverGuard(editor.getRootElement());
}

function removePreviewModeFromDOM(
  editor: LexicalEditor,
  nodeKey: string,
): void {
  const elem = editor.getElementByKey(nodeKey);
  if (!elem) return;
  elem.classList.remove(PREVIEW_MODE_CLASS);
  delete elem.dataset.view;
  elem.style.removeProperty('height');
  placeSpacer(elem, null, 0);
}

function readCodeContent(editor: LexicalEditor, nodeKey: string): string {
  let content = '';
  editor.getEditorState().read(() => {
    const node = $getNodeByKey(nodeKey);
    if (node) {
      content = node.getTextContent();
    }
  });
  return content;
}

interface OverlayPosition {
  top: number;
  left: number;
  width: number;
}

function usePositionTracking(
  editor: LexicalEditor,
  anchorElem: HTMLElement | undefined,
  widgets: Map<string, WidgetState>,
): [Map<string, OverlayPosition>, () => void] {
  const [positions, setPositions] = useState<Map<string, OverlayPosition>>(new Map());

  const measure = useCallback(() => {
    if (!anchorElem) return;
    const anchorRect = anchorElem.getBoundingClientRect();
    const next = new Map<string, OverlayPosition>();
    for (const [key, state] of widgets) {
      if (state.viewMode !== 'preview') continue;
      const elem = editor.getElementByKey(key);
      if (!elem) continue;
      const elemRect = elem.getBoundingClientRect();
      next.set(key, {
        top: elemRect.top - anchorRect.top + anchorElem.scrollTop,
        left: elemRect.left - anchorRect.left + anchorElem.scrollLeft,
        width: elemRect.width,
      });
    }
    setPositions((prev) => {
      let changed = prev.size !== next.size;
      const merged = new Map<string, OverlayPosition>();
      for (const [key, pos] of next) {
        const prevPos = prev.get(key);
        if (prevPos && prevPos.top === pos.top && prevPos.left === pos.left
          && prevPos.width === pos.width) {
          merged.set(key, prevPos);
        } else {
          merged.set(key, pos);
          changed = true;
        }
      }
      return changed ? merged : prev;
    });
  }, [editor, anchorElem, widgets]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    if (!anchorElem) return;
    let scheduledFrame: number | null = null;
    const scheduleMeasure = () => {
      if (scheduledFrame !== null) return;
      scheduledFrame = requestAnimationFrame(() => {
        scheduledFrame = null;
        measure();
      });
    };
    const unregister = editor.registerUpdateListener(scheduleMeasure);
    window.addEventListener('resize', scheduleMeasure);
    // Editor updates alone are not enough: the document reflows without any
    // Lexical update when images/iframes finish loading, when another
    // widget's spacer collapses or resizes, when fonts land, or when a
    // workspace panel resizes the editor column. Watch the editor's own
    // size — the anchor wrapper (width changes) and the contenteditable
    // root (height changes with content) — and re-measure on any of it.
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(anchorElem);
    const rootElem = editor.getRootElement();
    if (rootElem) resizeObserver.observe(rootElem);
    // EXPERIMENT (experiment/iframe-layout-ronny-exp3): the sliver guard moved a block below a widget.
    rootElem?.addEventListener(WIDGET_LAYOUT_EVENT, scheduleMeasure);
    return () => {
      unregister();
      rootElem?.removeEventListener(WIDGET_LAYOUT_EVENT, scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      resizeObserver.disconnect();
      if (scheduledFrame !== null) cancelAnimationFrame(scheduledFrame);
    };
  }, [editor, anchorElem, measure]);

  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): for callers that restyle a spacer without an
  // editor update (a live resize), which none of the observers above notice.
  const measureRef = useRef(measure);
  measureRef.current = measure;
  const pendingFrame = useRef<number | null>(null);
  const scheduleMeasure = useCallback(() => {
    if (pendingFrame.current !== null) return;
    pendingFrame.current = requestAnimationFrame(() => {
      pendingFrame.current = null;
      measureRef.current();
    });
  }, []);
  useEffect(() => () => {
    if (pendingFrame.current !== null) cancelAnimationFrame(pendingFrame.current);
  }, []);

  return [positions, scheduleMeasure];
}

/** EXPERIMENT (experiment/iframe-layout-ronny-exp2): the widget options button's icon (Feather's "settings"). */
function GearIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>;
}

function ToggleButton({
  viewMode,
  onClick,
  className,
  style,
}: {
  viewMode: 'code' | 'preview';
  onClick: () => void;
  className: string;
  style?: React.CSSProperties;
}) {
  const classes = useStyles(styles);

  const title = viewMode === 'code' ? 'Switch to preview' : 'Switch to code';
  return (
    <button
      className={className}
      onClick={(e) => { e.stopPropagation(); e.preventDefault(); onClick(); }}
      title={title}
      type="button"
      tabIndex={-1}
      style={style}
    >
      {viewMode === 'code' ? <ForumIcon icon="Eye" className={classes.icon} /> : <CodeIcon />}
    </button>
  );
}

function LayoutControls({ layout, columnWidth, onChange }: {
  layout: IframeWidgetLayout,
  columnWidth: number,
  onChange: (layout: IframeWidgetLayout) => void,
}) {
  const classes = useStyles(styles);
  const sided = layout.position === 'left' || layout.position === 'right';
  const width = layout.width ?? DEFAULT_WRAP_WIDTH;
  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): only the widths not too narrow to use in this
  // column (see MIN_WIDGET_WIDTH), plus the widget's own width, which it keeps.
  const px = (w: string) => widgetWidthPx({ position: 'left', width: w }, columnWidth) ?? columnWidth;
  const offered = offeredWidths(columnWidth);
  const widths = offered.includes(width) ? offered : [...offered, width].sort((a, b) => px(a) - px(b));
  const tooWide = columnWidth - px(width) - WRAP_GUTTER < MIN_TEXT_BESIDE_WIDGET;
  const button = (active: boolean, label: string, next: IframeWidgetLayout) => <button
    key={label}
    type="button"
    tabIndex={-1}
    className={classNames(classes.layoutButton, active && classes.layoutButtonActive)}
    onMouseDown={(e) => e.preventDefault()}
    onClick={(e) => { e.stopPropagation(); e.preventDefault(); onChange(next); }}
  >{label}</button>;
  return (
    <div className={classes.layoutBar}>
      {LAYOUT_POSITIONS.map(({ position, label }) => button(
        layout.position === position || (position === 'inline' && layout.position === 'center'),
        label,
        position === 'inline' ? { position: 'inline', width: null } : { position, width },
      ))}
      {sided && <>
        <span className={classes.layoutDivider}/>
        {widths.map(w => button(w === width, w, { position: layout.position, width: w }))}
        {!shouldWrapWidget(layout, columnWidth) && <span className={classes.layoutNote}>
          {tooWide ? 'too wide to wrap here' : 'too narrow to wrap here'}
        </span>}
      </>}
    </div>
  );
}

const preventDefault = (e: React.SyntheticEvent) => e.preventDefault();

const IframeWidgetOverlay = React.memo(function IframeWidgetOverlay({
  nodeKey,
  state,
  position,
  columnWidth,
  onToggle,
  onIframeResize,
  onLayoutChange,
  dragEnabled = false,
  gesture = null,
  hint = false,
  onGripPointerDown,
  onResizePointerDown,
  onGripKeyDown,
  onOptionsChange,
}: {
  nodeKey: string;
  state: WidgetState;
  position: OverlayPosition | undefined;
  columnWidth: number;
  onToggle: (nodeKey: string) => void;
  onIframeResize: (nodeKey: string, height: number, fit: IframeWidgetFit | null) => void;
  onLayoutChange: (nodeKey: string, layout: IframeWidgetLayout) => void;
  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): drag-to-place (see IframeWidgetDragContext).
  dragEnabled?: boolean;
  /** This widget's gesture, if one is under way. */
  gesture?: GesturePhase | null;
  /** Show the grip before any hover, pulsing (until the first drag on the page). */
  hint?: boolean;
  onGripPointerDown?: (nodeKey: string, e: React.PointerEvent<HTMLElement>) => void;
  onResizePointerDown?: (nodeKey: string, edge: WidgetSide, e: React.PointerEvent<HTMLElement>) => void;
  onGripKeyDown?: (nodeKey: string, e: React.KeyboardEvent<HTMLElement>) => void;
  /** EXPERIMENT (experiment/iframe-layout-ronny-exp2): a choice in the gear's menu (one undo step each). */
  onOptionsChange?: (nodeKey: string, layout: IframeWidgetLayout) => void;
}) {
  const classes = useStyles(styles);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): the gear button's options (WidgetOptionsMenu),
  // closed when a drag of this widget starts.
  const [optionsOpen, setOptionsOpen] = useState(false);
  const gearRef = useRef<HTMLButtonElement>(null);
  const closeOptions = useCallback((refocus?: boolean) => {
    setOptionsOpen(false);
    if (refocus) gearRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    if (gesture) setOptionsOpen(false);
  }, [gesture]);
  const handleGripPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => onGripPointerDown?.(nodeKey, e),
    [onGripPointerDown, nodeKey],
  );
  const handleGripKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => onGripKeyDown?.(nodeKey, e),
    [onGripKeyDown, nodeKey],
  );
  const handleResizeLeft = useCallback(
    (e: React.PointerEvent<HTMLElement>) => onResizePointerDown?.(nodeKey, 'left', e),
    [onResizePointerDown, nodeKey],
  );
  const handleResizeRight = useCallback(
    (e: React.PointerEvent<HTMLElement>) => onResizePointerDown?.(nodeKey, 'right', e),
    [onResizePointerDown, nodeKey],
  );

  useEffect(() => {
    function handler(event: MessageEvent) {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type !== 'iframe-widget-resize') return;
      onIframeResize(nodeKey, clampIframeHeight(event.data.height), readIframeWidgetFit(event.data));
    }
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [nodeKey, onIframeResize]);

  const handleToggleClick = useCallback(() => onToggle(nodeKey), [onToggle, nodeKey]);
  const handleLayoutChange = useCallback((layout: IframeWidgetLayout) => onLayoutChange(nodeKey, layout), [onLayoutChange, nodeKey]);
  const handleOptionsChange = useCallback(
    (layout: IframeWidgetLayout) => (onOptionsChange ?? onLayoutChange)(nodeKey, layout),
    [onOptionsChange, onLayoutChange, nodeKey],
  );
  // The gear keeps the focus while its menu is open (the menu's buttons don't take it), so, like a grip,
  // it passes the editor's undo and redo shortcuts on.
  const handleGearKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (isUndoShortcut(e.nativeEvent) || isRedoShortcut(e.nativeEvent)) onGripKeyDown?.(nodeKey, e);
  }, [onGripKeyDown, nodeKey]);

  // The layout tag only places the frame, so changing it doesn't reload the widget.
  const widgetHtml = stripIframeWidgetLayout(state.htmlContent);
  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): in the drag editor the frame also says how small
  // the widget shows, for the shrink warning.
  const srcdoc = useMemo(
    () => widgetHtml.trim()
      ? injectResizeScript(stripDeletedMarkupFromSrcdoc(widgetHtml), { measure: dragEnabled })
      : '',
    [widgetHtml, dragEnabled],
  );

  if (state.viewMode !== 'preview' || !position) return null;

  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): a widget is dragged among the post's blocks. A widget
  // the text wraps around resizes from its text side; a full-width one from either edge (pulling an edge
  // in makes it a float). No edges when no width can wrap in this column. (Every widget is top-level:
  // $hoistWidget moves one out of any block.)
  const draggable = dragEnabled && !!srcdoc && state.topLevel;
  const adjustable = draggable;
  const resizeEdges: WidgetSide[] = !adjustable || wrappableWidths(columnWidth).length === 0 ? []
    : shouldWrapWidget(state.layout, columnWidth) ? [state.layout.position === 'left' ? 'right' : 'left']
    : ['left', 'right'];
  // The code toggle and the gear keep clear of the edges, so the whole strip can be grabbed. (In the drag
  // editor the gear's menu takes the place of the placement bar.)
  const toggleRight = resizeEdges.includes('right') ? RESIZE_EDGE_WIDTH + 2 : 4;
  const gearRight = toggleRight + 32;
  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): says so when this width leaves the widget too small.
  // Only from a measurement at its present width (none while it reflows to a new one), and not while
  // it's being moved.
  const warning = adjustable && gesture !== 'moving' && state.fit && fitMatchesWidth(state.fit, position.width)
    ? shrinkWarning(state.fit) : null;

  return (<>
    <div
      className={classNames(
        classes.previewOverlay,
        adjustable && classes.dragMode,
        adjustable && gesture && classes.controlsPinned,
        gesture === 'moving' && classes.overlayMoving,
        draggable && hint && classes.overlayHint,
      )}
      style={{ top: position.top, left: position.left, width: position.width }}
      data-testid={dragEnabled ? 'widget-overlay' : undefined}
      data-widget-key={dragEnabled ? nodeKey : undefined}
      data-widget-id={dragEnabled ? state.widgetId ?? undefined : undefined}
      data-gesture={dragEnabled ? gesture ?? 'none' : undefined}
    >
      <ToggleButton
        viewMode="preview"
        onClick={handleToggleClick}
        className={classNames(classes.toggleButton, adjustable && 'lw-widget-control')}
        style={{ top: adjustable ? 22 : 4, right: toggleRight }}
      />
      {adjustable && <button
        ref={gearRef}
        type="button"
        className={classNames(classes.toggleButton, 'lw-widget-control', optionsOpen && classes.gearOpen)}
        style={{ top: 22, right: gearRight }}
        title="Widget options"
        aria-label="Widget options"
        aria-haspopup="dialog"
        aria-expanded={optionsOpen}
        data-testid="widget-options"
        data-widget-key={nodeKey}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOptionsOpen(open => !open); }}
        onKeyDown={handleGearKeyDown}
      ><GearIcon/></button>}
      {draggable && <button
        type="button"
        className={classNames(classes.gripTab, 'lw-widget-control', 'lw-widget-grip', hint && classes.gripHint)}
        data-testid="widget-grip"
        data-widget-key={nodeKey}
        aria-label="Move widget"
        title="Drag to move. Or click it: then the arrow keys move it, and Backspace deletes it."
        onPointerDown={handleGripPointerDown}
        onMouseDown={preventDefault}
        onKeyDown={handleGripKeyDown}
      ><span className={classes.gripDots}/></button>}
      {resizeEdges.map((edge) => <div
        key={edge}
        className={classNames(classes.resizeEdge, 'lw-widget-control')}
        style={edge === 'left' ? { left: 0 } : { right: 0 }}
        data-testid={`widget-resize-${edge}`}
        data-widget-key={nodeKey}
        title="Drag to resize"
        onPointerDown={edge === 'left' ? handleResizeLeft : handleResizeRight}
        onMouseDown={preventDefault}
      />)}
      {srcdoc && !adjustable && <LayoutControls
        layout={state.layout}
        columnWidth={columnWidth}
        onChange={handleLayoutChange}
      />}
      {srcdoc ? (
        <iframe
          ref={iframeRef}
          className={classes.iframe}
          srcDoc={srcdoc}
          sandbox="allow-scripts"
          scrolling="no"
          title="Embedded widget preview"
          style={{ height: state.previewHeight }}
        />
      ) : (
        <div className={classes.emptyPreview}>No HTML content</div>
      )}
    </div>
    {adjustable && optionsOpen && <WidgetOptionsMenu
      layout={state.layout}
      columnWidth={columnWidth}
      style={{
        top: position.top + 22 + 32,
        left: Math.max(0, position.left + position.width - gearRight - OPTIONS_MENU_WIDTH),
      }}
      onChange={handleOptionsChange}
      onClose={closeOptions}
    />}
    {warning && <div
      className={classes.shrinkWarning}
      style={{ top: position.top + state.previewHeight + 3, left: position.left + 4, maxWidth: Math.max(60, position.width - 8) }}
      data-testid="widget-shrink-warning"
      data-widget-key={nodeKey}
    >⚠ {warning}</div>}
  </>);
});

const IframeWidgetCodeToggle = React.memo(function IframeWidgetCodeToggle({
  nodeKey,
  editor,
  anchorElem,
  onToggle,
}: {
  nodeKey: string;
  editor: LexicalEditor;
  anchorElem: HTMLElement;
  onToggle: (nodeKey: string) => void;
}) {
  const classes = useStyles(styles);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  useEffect(() => {
    function measure() {
      const elem = editor.getElementByKey(nodeKey);
      if (!elem) return;
      const codeRect = elem.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();
      const top = codeRect.top - anchorRect.top + anchorElem.scrollTop + 4;
      const right = anchorRect.right - codeRect.right + 4;
      setPosition((prev) => (prev && prev.top === top && prev.right === right ? prev : { top, right }));
    }
    measure();
    let scheduledFrame: number | null = null;
    const scheduleMeasure = () => {
      if (scheduledFrame !== null) return;
      scheduledFrame = requestAnimationFrame(() => {
        scheduledFrame = null;
        measure();
      });
    };
    const unregister = editor.registerUpdateListener(scheduleMeasure);
    window.addEventListener('resize', scheduleMeasure);
    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(anchorElem);
    const rootElem = editor.getRootElement();
    if (rootElem) resizeObserver.observe(rootElem);
    // EXPERIMENT (experiment/iframe-layout-ronny-exp3): the sliver guard moved a block below a widget.
    rootElem?.addEventListener(WIDGET_LAYOUT_EVENT, scheduleMeasure);
    return () => {
      unregister();
      rootElem?.removeEventListener(WIDGET_LAYOUT_EVENT, scheduleMeasure);
      window.removeEventListener('resize', scheduleMeasure);
      resizeObserver.disconnect();
      if (scheduledFrame !== null) cancelAnimationFrame(scheduledFrame);
    };
  }, [editor, nodeKey, anchorElem]);

  const handleToggleClick = useCallback(() => onToggle(nodeKey), [onToggle, nodeKey]);

  if (!position) return null;

  return (
    <ToggleButton
      viewMode="code"
      onClick={handleToggleClick}
      className={classes.toggleButton}
      style={{ top: position.top, right: position.right }}
    />
  );
});

export default function IframeWidgetPlugin({
  anchorElem,
  isSuggestionMode,
}: {
  anchorElem?: HTMLElement;
  isSuggestionMode?: boolean;
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext();
  const {flash} = useMessages();
  const [widgets, setWidgets] = useState<Map<string, WidgetState>>(new Map);
  const widgetsRef = useRef(widgets);
  widgetsRef.current = widgets;
  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): a live resize restyles the widget's spacer without
  // touching the document. These layouts win over the stored ones until the resize ends, so an iframe
  // reporting a new height mid-resize doesn't undo it.
  const previewOverrides = useRef(new Map<string, IframeWidgetLayout>());

  useEffect(() => {
    if (!editor.hasNodes([IframeWidgetNode])) {
      throw new Error('IframeWidgetPlugin: IframeWidgetNode not registered on editor');
    }

    // EXPERIMENT (experiment/iframe-layout-ronny-exp3): Backspace and Delete next to a widget join the text
    // around it and never delete or change it (widgetDeleteGuard.ts). Ahead of the caret-gap plugin's
    // Backspace (LOW) and the rich text defaults; the delete commands cover input that skips the keys.
    const guardKey = (direction: 'backward' | 'forward') => (event: KeyboardEvent | null) => {
      if (!$guardWidgetsFromDeleteKey(direction, !isSuggestionMode)) return false;
      event?.preventDefault();
      return true;
    };
    const guardDelete = (isBackward: boolean) => $guardWidgetsFromDeleteKey(isBackward ? 'backward' : 'forward', !isSuggestionMode);

    return mergeRegister(
      editor.registerNodeTransform(IframeWidgetNode, $hoistWidget),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, guardKey('backward'), COMMAND_PRIORITY_NORMAL),
      editor.registerCommand(KEY_DELETE_COMMAND, guardKey('forward'), COMMAND_PRIORITY_NORMAL),
      editor.registerCommand(DELETE_CHARACTER_COMMAND, guardDelete, COMMAND_PRIORITY_NORMAL),
      editor.registerCommand(DELETE_WORD_COMMAND, guardDelete, COMMAND_PRIORITY_NORMAL),
      editor.registerCommand(DELETE_LINE_COMMAND, guardDelete, COMMAND_PRIORITY_NORMAL),
      // EXPERIMENT (experiment/iframe-layout-ronny-exp2)
      editor.registerCommand<MoveIframeWidgetPayload>(
        MOVE_IFRAME_WIDGET_COMMAND,
        (payload) => !isSuggestionMode && $moveIframeWidget(payload),
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerCommand<string | undefined>(
        INSERT_IFRAME_WIDGET_COMMAND,
        (payload) => {
          if (isSuggestionMode) {
            flash({
              messageString: 'Iframe widgets are not supported in suggestion mode',
              type: 'error',
            });
            return true;
          }
          const node = $createIframeWidgetNode(randomId());
          if (payload) {
            node.append($createTextNode(payload));
          }
          $insertNodeToNearestRoot(node);
          return true;
        },
        COMMAND_PRIORITY_EDITOR,
      ),
      editor.registerMutationListener(IframeWidgetNode, (mutations) => {
        const tracked = widgetsRef.current;
        const removed: string[] = [];
        const added: Array<{ key: string; state: WidgetState }> = [];
        const relaid: Array<{ key: string; htmlContent: string; layout: IframeWidgetLayout }> = [];
        // EXPERIMENT (experiment/iframe-layout-ronny-exp2): previewed widgets whose element lost its
        // preview styling (were Lexical ever to recreate it on a move, undo or redo), and widgets that
        // went into or out of another block (columns, a table, a collapsible...).
        const reapply: Array<{ key: string; state: WidgetState }> = [];
        const reparented: Array<{ key: string; topLevel: boolean }> = [];
        editor.getEditorState().read(() => {
          for (const [key, type] of mutations) {
            if (type === 'destroyed') {
              if (tracked.has(key)) removed.push(key);
            } else if (tracked.has(key)) {
              // A previewed widget's placement can change under it (undo, redo): keep the preview in step.
              const state = tracked.get(key)!;
              const node = $getNodeByKey(key);
              const htmlContent = node?.getTextContent() ?? '';
              const layout = parseIframeWidgetLayout(htmlContent);
              if (state.viewMode === 'preview'
                && (layout.position !== state.layout.position || layout.width !== state.layout.width)) {
                relaid.push({ key, htmlContent, layout });
              }
              if (state.viewMode === 'preview'
                && !editor.getElementByKey(key)?.classList.contains(PREVIEW_MODE_CLASS)) {
                reapply.push({ key, state: { ...state, layout } });
              }
              const topLevel = $isTopLevelBlock(node);
              if (topLevel !== state.topLevel) reparented.push({ key, topLevel });
            } else {
              const node = $getNodeByKey(key);
              const htmlContent = node ? node.getTextContent() : '';
              const hasContent = htmlContent.trim().length > 0;
              added.push({
                key,
                state: {
                  viewMode: hasContent ? 'preview' : 'code',
                  previewHeight: IFRAME_DEFAULT_HEIGHT,
                  htmlContent: hasContent ? htmlContent : '',
                  layout: parseIframeWidgetLayout(htmlContent),
                  widgetId: $isIframeWidgetNode(node) ? node.getWidgetId() : null,
                  topLevel: $isTopLevelBlock(node),
                },
              });
            }
          }
        });
        if (removed.length === 0 && added.length === 0 && relaid.length === 0 && reapply.length === 0
          && reparented.length === 0) return;
        if (removed.length > 0 || added.length > 0 || relaid.length > 0 || reparented.length > 0) {
          setWidgets((prev) => {
            const next = new Map(prev);
            for (const key of removed) next.delete(key);
            for (const { key, state } of added) {
              if (!next.has(key)) next.set(key, state);
            }
            for (const { key, htmlContent, layout } of relaid) {
              const state = next.get(key);
              if (state) next.set(key, { ...state, htmlContent, layout });
            }
            for (const { key, topLevel } of reparented) {
              const state = next.get(key);
              if (state) next.set(key, { ...state, topLevel });
            }
            return next;
          });
        }
        for (const { key, state } of added) {
          if (state.viewMode === 'preview') {
            applyPreviewModeToDOM(editor, key, state.previewHeight, state.layout);
          }
        }
        for (const { key, state } of reapply) {
          applyPreviewModeToDOM(editor, key, state.previewHeight, previewOverrides.current.get(key) ?? state.layout);
        }
      }, {skipInitialization: false}),
      editor.registerMutationListener(IframeWidgetNode, (mutations) => {
        for (const [key, type] of mutations) {
          if (type !== 'destroyed') {
            updateWidgetGutter(key, editor);
          }
        }
      }, {skipInitialization: false}),
    );
  }, [editor, isSuggestionMode, flash]);

  // Apply/remove preview-mode CSS on code block DOM elements.
  // useLayoutEffect ensures this runs before position measurement
  // (declared in usePositionTracking below), so the overlay sees the
  // collapsed spacer dimensions rather than the full code block.
  // The editor's text column width, for deciding which widgets have room to wrap.
  const [columnWidth, setColumnWidth] = useState(0);
  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) return;
    const measure = () => setColumnWidth(editorColumnWidth(editor));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [editor]);

  useLayoutEffect(() => {
    for (const [key, state] of widgets) {
      if (state.viewMode === 'preview') {
        applyPreviewModeToDOM(editor, key, state.previewHeight, previewOverrides.current.get(key) ?? state.layout);
      } else {
        removePreviewModeFromDOM(editor, key);
      }
    }
  }, [editor, widgets, columnWidth]);

  const widgetKeys = Array.from(widgets.keys());
  const [positions, scheduleMeasure] = usePositionTracking(editor, anchorElem, widgets);

  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): a widget aligned to the bottom of its paragraph moves
  // whenever that paragraph's text changes, so it's lined up again after every edit.
  useEffect(() => editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
    const root = editor.getRootElement();
    if (dirtyElements.size + dirtyLeaves.size === 0) {
      // EXPERIMENT (experiment/iframe-layout-ronny-exp3): the caret moved into the gap between two blocks:
      // narrow its line beside a widget for the layout as it is now (an image may have loaded since).
      if (widgetsRef.current.size && editorState.read($selectionInSentinel)) scheduleSliverGuard(root);
      return;
    }
    // EXPERIMENT (experiment/iframe-layout-ronny-exp3): the text reflowed, so check the boxes beside widgets
    // (and widen a caret line left narrowed beside a widget that is gone).
    if (widgetsRef.current.size || root?.querySelector(`[${CARET_BESIDE_ATTR}]`)) scheduleSliverGuard(root);
    let moved = false;
    for (const [key, state] of widgetsRef.current) {
      const layout = previewOverrides.current.get(key) ?? state.layout;
      if (state.viewMode !== 'preview' || alignOf(layout) !== 'bottom') continue;
      applyPreviewModeToDOM(editor, key, state.previewHeight, layout);
      moved = true;
    }
    if (moved) scheduleMeasure();
  }), [editor, scheduleMeasure]);

  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): ...and when the sliver guard moved a block below a
  // widget, which can move the paragraph a later widget lines up with.
  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) return;
    const realignAll = () => {
      for (const [key, state] of widgetsRef.current) {
        const layout = previewOverrides.current.get(key) ?? state.layout;
        if (state.viewMode === 'preview' && alignOf(layout) === 'bottom') {
          applyPreviewModeToDOM(editor, key, state.previewHeight, layout);
        }
      }
    };
    const realign = (event: Event) => {
      if (mayRealignAfterGuard(root, event, realignAll)) realignAll();
    };
    root.addEventListener(WIDGET_LAYOUT_EVENT, realign);
    return () => root.removeEventListener(WIDGET_LAYOUT_EVENT, realign);
  }, [editor]);

  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): each widget's measurements by width (px), so the
  // resize chip can say at once what a width it has already been shown at does to it.
  const fitCache = useRef(new Map<string, Map<number, IframeWidgetFit>>());
  const handleToggle = useCallback((key: string) => {
    // Switching to code view: mark the node dirty so the code highlighter (which skips previews)
    // tokenizes it now.
    if (widgetsRef.current.get(key)?.viewMode === 'preview') {
      editor.update(() => { $getNodeByKey(key)?.markDirty(); });
    }
    // EXPERIMENT (experiment/iframe-layout-ronny-exp2): its code may change, and with it how small it shows.
    fitCache.current.delete(key);
    setWidgets((prev) => {
      const next = new Map(prev);
      const state = next.get(key);
      if (!state) return prev;
      if (state.viewMode === 'code') {
        const htmlContent = readCodeContent(editor, key);
        next.set(key, { ...state, viewMode: 'preview', htmlContent, layout: parseIframeWidgetLayout(htmlContent) });
      } else {
        next.set(key, { ...state, viewMode: 'code' });
      }
      return next;
    });
  }, [editor]);

  const handleIframeResize = useCallback((key: string, height: number, fit: IframeWidgetFit | null) => {
    const current = widgetsRef.current.get(key);
    if (fit) {
      const byWidth = fitCache.current.get(key) ?? new Map<number, IframeWidgetFit>();
      byWidth.set(Math.round(fit.width), fit);
      fitCache.current.set(key, byWidth);
    }
    setWidgets((prev) => {
      const next = new Map(prev);
      const state = next.get(key);
      if (!state) return prev;
      next.set(key, { ...state, previewHeight: height, fit });
      return next;
    });
    if (current) applyPreviewModeToDOM(editor, key, height, previewOverrides.current.get(key) ?? current.layout);
  }, [editor]);

  // Writes the placement into the widget's own HTML (its <meta name="lw-layout"> tag), which is what
  // the published post reads.
  const handleLayoutChange = useCallback((key: string, layout: IframeWidgetLayout) => {
    editor.update(() => {
      const node = $getNodeByKey(key);
      if (!$isIframeWidgetNode(node)) return;
      const html = setIframeWidgetLayout(node.getTextContent(), layout);
      node.clear();
      node.append($createTextNode(html));
    });
    setWidgets((prev) => {
      const next = new Map(prev);
      const state = next.get(key);
      if (!state) return prev;
      next.set(key, { ...state, layout, htmlContent: setIframeWidgetLayout(state.htmlContent, layout) });
      return next;
    });
  }, [editor]);

  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): drag a widget by the grip on its top edge to move
  // it (sideways to switch sides), pull its edges to resize it, or use the keys on a focused grip.
  // Only where an IframeWidgetDragContext turns it on (the Experiment 2 demo editor).
  const dragContext = useContext(IframeWidgetDragContext);
  const [editable, setEditable] = useState(() => editor.isEditable());
  useEffect(() => editor.registerEditableListener(setEditable), [editor]);
  const dragEnabled = dragContext && editable && !isSuggestionMode;
  const dragEnabledRef = useRef(dragEnabled);
  dragEnabledRef.current = dragEnabled;
  const [gesture, setGesture] = useState<{ key: string, phase: GesturePhase } | null>(null);
  const cancelGesture = useRef<null | (() => void)>(null);
  const [dragViewStore] = useState(() => new DragViewStore());
  const [announcement, setAnnouncement] = useState('');
  const [hintDone, setHintDone] = useState(false);

  // The anchor's data-lw-drag (idle, moving or resizing) is a test hook. Leaving drag mode, or
  // unmounting, mid-gesture cancels the gesture.
  useEffect(() => {
    if (!anchorElem || !dragEnabled) return;
    anchorElem.dataset.lwDrag = 'idle';
    return () => {
      cancelGesture.current?.();
      delete anchorElem.dataset.lwDrag;
    };
  }, [anchorElem, dragEnabled]);

  /**
   * Moves the widget before `beforeKey` (null: the end of the post; undefined: stays put) and/or gives
   * it `layout`, as one undo step. Returns whether the editor took it.
   */
  const commitPlacement = useCallback((key: string, beforeKey: string | null | undefined, layout?: IframeWidgetLayout): boolean => {
    const before = widgetsRef.current.get(key);
    const handled = editor.dispatchCommand(MOVE_IFRAME_WIDGET_COMMAND, { key, beforeKey, layout });
    if (handled && layout && before && !sameLayout(before.layout, layout)) {
      // Show the new layout now rather than when the editor's update lands.
      setWidgets((prev) => {
        const next = new Map(prev);
        const state = next.get(key);
        if (!state) return prev;
        next.set(key, { ...state, layout, htmlContent: setIframeWidgetLayout(state.htmlContent, layout) });
        return next;
      });
      if (before.viewMode === 'preview') applyPreviewModeToDOM(editor, key, before.previewHeight, layout);
    }
    scheduleMeasure();
    return handled;
  }, [editor, scheduleMeasure]);

  const endGesture = useCallback(() => {
    cancelGesture.current = null;
    setGesture(null);
    dragViewStore.set(null);
    if (anchorElem) anchorElem.dataset.lwDrag = 'idle';
  }, [anchorElem, dragViewStore]);

  /** A widget's grip tab, which takes the focus back after a gesture started from inside its iframe. */
  const gripTabOf = useCallback(
    (key: string) => anchorElem?.querySelector<HTMLElement>(`.lw-widget-grip[data-widget-key="${key}"]`) ?? null,
    [anchorElem],
  );

  const startMove = useCallback((key: string, e: React.PointerEvent<HTMLElement>) => {
    const start = widgetsRef.current.get(key);
    if (cancelGesture.current || e.button !== 0 || !anchorElem || !dragEnabledRef.current || !start?.topLevel) return;
    // Only a widget among the blocks a drop goes between (not one past the footnotes) can be moved.
    const inPost = (blocks: BlockBox[]) => blocks.some(b => b.key === key && b.kind === 'widget');
    if (!inPost(measureBlocks(editor).blocks)) return;
    e.preventDefault();
    e.stopPropagation();
    const grip = e.currentTarget;
    // As tall as the widget, so the ghost shows what the drop will cover or push down.
    const ghostHeight = Math.round(start.previewHeight);
    let slot: DropSlot | null = null;
    let column: ColumnRect = editorColumnRect(editor);
    setGesture({ key, phase: 'pressed' });
    cancelGesture.current = startPointerGesture(e.nativeEvent, {
      cursor: 'grabbing',
      threshold: e.pointerType === 'touch' ? 8 : 4,
      autoScroll: true,
      onStart: () => {
        setGesture({ key, phase: 'moving' });
        setHintDone(true);
        anchorElem.dataset.lwDrag = 'moving';
      },
      onFrame: (point) => {
        // Measured fresh every frame: auto-scroll, wheel scrolling and window resizes just work.
        const measured = measureBlocks(editor);
        // The widget went away, or into another block, under the drag: drop nothing.
        if (!inPost(measured.blocks)) {
          slot = null;
          cancelGesture.current?.();
          return;
        }
        column = measured.column;
        slot = chooseDropSlot({
          blocks: measured.blocks,
          draggedKey: key,
          pointerX: point.x,
          pointerY: point.y,
          column,
          layout: start.layout,
          prevSide: slot ? widgetSide(slot.layout) : null,
          ghostHeight,
        });
        dragViewStore.set(moveView(slot, start.layout, column, anchorElem, ghostHeight, renderedChipHeight(anchorElem)));
      },
      onCommit: () => {
        if (!slot || slot.noOp) return false;
        // Dropped on its own slot: only the side changes, the widget stays put.
        const beforeKey = slot.sameSlot ? undefined : slot.beforeKey;
        const description = describePlacement(editor, key, slot.layout, slot.sameSlot ? undefined : slot.slotKey, column.width);
        // Where the preview showed it.
        const shownAt = slot.ghostTop ?? slot.lineY;
        if (!commitPlacement(key, beforeKey, slot.layout)) return false;
        setAnnouncement(`Moved. ${description}`);
        // The widget leaves its old place when it lands (so everything below that collapses), and
        // scroll anchoring may pick a block on either side: once the drop has been laid out, scroll so
        // the widget is where the preview was, rather than letting the page jump under the pointer.
        // A drop that landed out of view (aimed at the dashed stand-in at the window's edge) is then
        // scrolled into view, gently, its top below the site header.
        requestAnimationFrame(() => {
          const elem = editor.getElementByKey(key);
          if (!elem) return;
          let rect = elem.getBoundingClientRect();
          if (Math.abs(rect.top - shownAt) > DROP_SCROLL_TOLERANCE) {
            window.scrollBy(0, rect.top - shownAt);
            rect = elem.getBoundingClientRect();
          }
          if (rect.bottom < KEY_MOVE_TOP_ROOM || rect.top > visibleBottom() - DROP_SCROLL_TOLERANCE) {
            window.scrollBy({ top: rect.top - KEY_MOVE_TOP_ROOM, behavior: 'smooth' });
          }
        });
        return true;
      },
      onCancel: () => {},
      // A click on the grip changes nothing; it focuses the grip for the arrow keys.
      onClick: () => grip.focus({ preventScroll: true }),
      onEnd: endGesture,
      refocus: () => gripTabOf(key),
    });
  }, [editor, anchorElem, commitPlacement, dragViewStore, endGesture, gripTabOf]);

  /** The shrink warning for widget `key` shown `width` px wide, if its frame has reported at that width. */
  const shrinkWarningAt = useCallback((key: string, width: number): string | null => {
    let closest: IframeWidgetFit | null = null;
    for (const fit of fitCache.current.get(key)?.values() ?? []) {
      if (fitMatchesWidth(fit, width) && (!closest || Math.abs(fit.width - width) < Math.abs(closest.width - width))) {
        closest = fit;
      }
    }
    return shrinkWarning(closest);
  }, []);

  const startResize = useCallback((key: string, edge: WidgetSide, e: React.PointerEvent<HTMLElement>) => {
    const start = widgetsRef.current.get(key);
    if (cancelGesture.current || e.button !== 0 || !anchorElem || !dragEnabledRef.current || !start?.topLevel) return;
    e.preventDefault();
    e.stopPropagation();
    const startWraps = shouldWrapWidget(start.layout, editorColumnWidth(editor));
    let current = start.layout;
    let columnWidth = editorColumnWidth(editor);
    /**
     * Restyles the widget for `layout` and scrolls by however far that moved it, so it stays under the
     * pointer: a full-width widget that becomes a float stops clearing the floats before it, and may
     * jump up beside one (and back down when it goes full width again).
     */
    const relayout = (previewHeight: number, layout: IframeWidgetLayout) => {
      const spacer = editor.getElementByKey(key);
      const before = spacer?.getBoundingClientRect().top;
      applyPreviewModeToDOM(editor, key, previewHeight, layout);
      const after = spacer?.getBoundingClientRect().top;
      if (before !== undefined && after !== undefined && Math.abs(after - before) > 1) window.scrollBy(0, after - before);
      scheduleMeasure();
    };
    const restore = () => {
      previewOverrides.current.delete(key);
      const state = widgetsRef.current.get(key);
      if (state?.viewMode !== 'preview') {
        scheduleMeasure();
        return;
      }
      // EXPERIMENT (experiment/iframe-layout-ronny-exp3): back at its starting width, the widget is as tall
      // as when the gesture started. Its frame reported the preview width's height meanwhile; keeping that
      // until the frame reported again moved everything below the widget a few frames after Escape.
      relayout(start.previewHeight, state.layout);
      setWidgets((prev) => {
        const now = prev.get(key);
        if (!now || (now.previewHeight === start.previewHeight && now.fit === start.fit)) return prev;
        const next = new Map(prev);
        next.set(key, { ...now, previewHeight: start.previewHeight, fit: start.fit });
        return next;
      });
    };
    setGesture({ key, phase: 'pressed' });
    cancelGesture.current = startPointerGesture(e.nativeEvent, {
      cursor: 'ew-resize',
      // Only a sideways pull resizes: a vertical slip on the edge (or, on a touch screen, the start of
      // a scroll) would otherwise snap an off-grid width (say 46%) to the nearest allowed one.
      threshold: e.pointerType === 'touch' ? 8 : 3,
      axis: 'x',
      autoScroll: false,
      onStart: () => {
        setGesture({ key, phase: 'resizing' });
        setHintDone(true);
        anchorElem.dataset.lwDrag = 'resizing';
      },
      onFrame: (point) => {
        const state = widgetsRef.current.get(key);
        if (!state || state.viewMode !== 'preview') {
          cancelGesture.current?.();
          return;
        }
        const column = editorColumnRect(editor);
        columnWidth = column.width;
        const target = resizeTarget({ edge, startLayout: start.layout, startWraps, pointerX: point.x, column });
        if (!sameLayout(target.layout, current)) {
          // A style-only preview: the text reflows around the new size, the document is untouched.
          current = target.layout;
          previewOverrides.current.set(key, current);
          relayout(state.previewHeight, current);
        }
        // The frame reports a few frames after the widget is restyled to a new width; until then the chip
        // has no warning for a width the widget hasn't been shown at yet.
        const shownWidth = target.wraps ? widgetWidthPx(target.layout, column.width) ?? column.width : column.width;
        dragViewStore.set(resizeView(target, column, editor.getElementByKey(key), anchorElem, point, shrinkWarningAt(key, shownWidth)));
      },
      onCommit: () => {
        previewOverrides.current.delete(key);
        if (sameLayout(current, start.layout)) {
          restore();
          return false;
        }
        const description = describePlacement(editor, key, current, undefined, columnWidth);
        if (!commitPlacement(key, undefined, current)) {
          restore();
          return false;
        }
        setAnnouncement(`Resized. ${description}`);
        return true;
      },
      onCancel: restore,
      onEnd: endGesture,
      refocus: () => gripTabOf(key),
    });
  }, [editor, anchorElem, commitPlacement, dragViewStore, endGesture, scheduleMeasure, gripTabOf, shrinkWarningAt]);

  // On a focused grip: arrow up/down move to the previous/next slot, left/right set the side, [ and ]
  // step the width. Each press is one undo step.
  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): a widget deleted on purpose: its grip selected and
  // Backspace or Delete, or a nested widget's gear menu. One undo step; the editor gets the focus back.
  const deleteWidget = useCallback((key: string) => {
    if (isSuggestionMode) return;
    editor.update(() => $deleteWidget(key));
    editor.focus();
  }, [editor, isSuggestionMode]);

  const handleGripKeyDown = useCallback((key: string, e: React.KeyboardEvent<HTMLElement>) => {
    if (cancelGesture.current || !dragEnabledRef.current) return;
    // The grips sit outside the editable text, so the editor never sees their keys: undo and redo
    // (with the editor's own shortcuts) are passed on here.
    const history = isUndoShortcut(e.nativeEvent) ? UNDO_COMMAND : isRedoShortcut(e.nativeEvent) ? REDO_COMMAND : null;
    if (history) {
      e.preventDefault();
      e.stopPropagation();
      editor.dispatchCommand(history, undefined);
      // The editor commits that a moment later, together with this: as for a move from the grip, the
      // caret stays put, so the grip keeps the focus and the page doesn't scroll to the caret.
      editor.update(() => {
        $addUpdateTag(SKIP_DOM_SELECTION_TAG);
        $addUpdateTag(SKIP_SCROLL_INTO_VIEW_TAG);
      });
      return;
    }
    if (e.altKey || e.ctrlKey || e.metaKey || (e.shiftKey && e.key.startsWith('Arrow'))) return;
    const state = widgetsRef.current.get(key);
    if (!state || state.viewMode !== 'preview' || !state.topLevel) return;
    const { layout } = state;
    const side = widgetSide(layout);
    const columnWidth = editorColumnWidth(editor);
    let slotKey: string | null | undefined;
    let beforeKey: string | null | undefined;
    let nextLayout: IframeWidgetLayout | undefined;
    switch (e.key) {
      case 'ArrowUp':
      case 'ArrowDown': {
        const { blocks } = measureBlocks(editor);
        const wraps = shouldWrapWidget(layout, columnWidth);
        slotKey = adjacentSlot(blocks, key, e.key === 'ArrowUp' ? 'up' : 'down', wraps);
        if (slotKey !== undefined) beforeKey = insertionKey(blocks, key, slotKey, wraps);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowRight': {
        const position: WidgetSide = e.key === 'ArrowLeft' ? 'left' : 'right';
        if (side && side !== position) nextLayout = { ...layout, position };
        break;
      }
      case '[':
      case ']': {
        const width = side ? stepWidth(layout.width, e.key === ']' ? 1 : -1, columnWidth) : null;
        if (width) nextLayout = { ...layout, width };
        break;
      }
      // EXPERIMENT (experiment/iframe-layout-ronny-exp3): the grip clicked (the widget selected).
      case 'Backspace':
      case 'Delete':
        e.preventDefault();
        e.stopPropagation();
        deleteWidget(key);
        return;
      default:
        return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (beforeKey === undefined && !nextLayout) return;
    setHintDone(true);
    const description = describePlacement(editor, key, nextLayout ?? layout, slotKey, columnWidth);
    if (!commitPlacement(key, beforeKey, nextLayout)) return;
    setAnnouncement(description);
    // Keep the widget in view once it has moved: its top, and as much of it as fits above the demo's
    // bottom bar (the grip alone, a 14px tab, would leave the widget itself below the window).
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const rect = editor.getElementByKey(key)?.getBoundingClientRect();
      if (!rect) return;
      const bottom = visibleBottom();
      if (rect.top < KEY_MOVE_TOP_ROOM) {
        window.scrollBy(0, rect.top - KEY_MOVE_TOP_ROOM);
      } else if (rect.bottom > bottom) {
        window.scrollBy(0, Math.min(rect.bottom - bottom, rect.top - KEY_MOVE_TOP_ROOM));
      }
    }));
  }, [editor, commitPlacement, deleteWidget]);

  // EXPERIMENT (experiment/iframe-layout-ronny-exp2): the gear menu's choices, like the keys on a grip: one
  // undo step each, announced for screen readers.
  const handleOptionsChange = useCallback((key: string, layout: IframeWidgetLayout) => {
    if (!dragEnabledRef.current) return;
    const description = describePlacement(editor, key, layout, undefined, editorColumnWidth(editor));
    if (commitPlacement(key, undefined, layout)) setAnnouncement(description);
  }, [editor, commitPlacement]);

  const hintKey = dragEnabled && !hintDone
    ? widgetKeys.find((key) => {
      const state = widgets.get(key)!;
      return state.viewMode === 'preview' && state.topLevel && stripIframeWidgetLayout(state.htmlContent).trim().length > 0;
    })
    : undefined;

  if (!anchorElem) return null;

  return createPortal(
    <>
      {widgetKeys.map((key) => {
        const state = widgets.get(key)!;
        if (state.viewMode === 'code') {
          return (
            <IframeWidgetCodeToggle
              key={key}
              nodeKey={key}
              editor={editor}
              anchorElem={anchorElem}
              onToggle={handleToggle}
            />
          );
        }
        return (
          <IframeWidgetOverlay
            key={key}
            nodeKey={key}
            state={state}
            position={positions.get(key)}
            columnWidth={columnWidth}
            onToggle={handleToggle}
            onIframeResize={handleIframeResize}
            onLayoutChange={handleLayoutChange}
            dragEnabled={dragEnabled}
            gesture={gesture?.key === key ? gesture.phase : null}
            hint={key === hintKey}
            onGripPointerDown={startMove}
            onResizePointerDown={startResize}
            onGripKeyDown={handleGripKeyDown}
            onOptionsChange={handleOptionsChange}
          />
        );
      })}
      {dragEnabled && <WidgetDragLayer store={dragViewStore} announcement={announcement}/>}
    </>,
    anchorElem,
  );
}

// EXPERIMENT (experiment/iframe-layout-ronny-exp2): what the drag layer shows, in anchor coordinates.

/** Gap between the pointer and the resize chip. */
const RESIZE_CHIP_GAP = 20;
/** Room the resize chip may need below the pointer (its longest text wraps to two lines). */
const RESIZE_CHIP_ROOM = 48;
/** Height of a one-line chip, until one has been drawn (see renderedChipHeight). */
const CHIP_LINE_HEIGHT = 24;
/** Room a move chip needs beyond its height; one placed lower goes above its point instead. */
const MOVE_CHIP_MARGIN = 2;
/** The chips keep this far from the top of the window (the site header is tucked away while dragging). */
const CHIP_TOP_MARGIN = 8;
/** A ghost cut off where a block that clears it starts keeps at least this much height. */
const MIN_CUT_GHOST = 40;

/**
 * The height of the chip drawn on the last frame (its text wraps to more lines in a narrow ghost or
 * column). Text that changes gets measured a frame later, and the chip placed again.
 */
function renderedChipHeight(anchorElem: HTMLElement): number {
  return anchorElem.querySelector<HTMLElement>('[data-testid=widget-drag-chip]')?.offsetHeight || CHIP_LINE_HEIGHT;
}

function moveView(
  slot: DropSlot,
  storedLayout: IframeWidgetLayout,
  column: ColumnRect,
  anchorElem: HTMLElement,
  ghostHeight: number,
  chipHeight: number,
): DragView {
  const { dx, dy } = anchorOffset(anchorElem);
  const left = Math.round(column.left + dx);
  const width = Math.round(column.width);
  let line = { top: Math.round(slot.lineY + dy), left, width };
  const side = widgetSide(slot.layout);
  const text = moveChipText(slot, storedLayout);
  let ghost: MoveDragView['ghost'] = null;
  // Client y of the line and of the chip's top: on the line, centered in the column...
  let lineY = slot.lineY;
  let chipY = slot.lineY - Math.round(chipHeight / 2);
  let chip: Omit<DragChip, 'top'> = { text, x: Math.round(left + (width / 2)), align: 'center', maxWidth: Math.max(120, width - 12) };
  if (slot.wraps && side && slot.ghostTop !== null && !slot.noOp) {
    const ghostWidth = Math.min(width, widgetWidthPx(slot.layout, column.width) ?? width);
    const ghostLeft = side === 'left' ? left : left + width - ghostWidth;
    // It stops where a divider, an embed or a full-width widget starts below it, which a taller widget
    // pushes down (the chip says so when the widget, not the text beside it, is what pushes it): drawn
    // across that block, it looked as if the block went beside it.
    const sectionEnd = slot.sectionEnd !== null && slot.ghostTop + ghostHeight > slot.sectionEnd ? slot.sectionEnd : null;
    const cut = sectionEnd !== null;
    const height = cut ? Math.min(ghostHeight, Math.max(MIN_CUT_GHOST, sectionEnd - slot.ghostTop)) : ghostHeight;
    ghost = { top: Math.round(slot.ghostTop + dy), left: ghostLeft, width: ghostWidth, height: Math.round(height), cut };
    // The line only spans the side the widget takes, so it doesn't run through a widget on the other,
    // and sits on the ghost's top when that is pushed below an earlier float on this side (at the gap
    // it would run through that float).
    if (slot.stacked) lineY = slot.ghostTop;
    line = { top: Math.round(lineY + dy), left: ghostLeft, width: ghostWidth };
    // ...or from the ghost's outer edge, inside it (on the line when the ghost is pushed below an
    // earlier float, where the pointer is), and no wider than it.
    chipY = slot.stacked ? slot.lineY + 6 : slot.ghostTop + 6;
    const maxWidth = Math.max(120, ghostWidth - 12);
    chip = side === 'left'
      ? { text, x: ghostLeft + 6, align: 'start', maxWidth }
      : { text, x: ghostLeft + ghostWidth - 6, align: 'end', maxWidth };
  }
  // Always readable: kept between the top of the window and the demo's bottom bar, even when the slot
  // itself is scrolled out of view or under the bar.
  const bottom = visibleBottom();
  // Where the line itself is out of view (or under the bar), a dashed stand-in is drawn at that edge,
  // the chip next to it says which way the drop lands, and auto-scroll (or the wheel) brings it in.
  const offscreen: MoveDragView['offscreen'] = lineY > bottom - 3 ? 'below' : lineY < CHIP_TOP_MARGIN ? 'above' : null;
  if (offscreen) {
    line = { ...line, top: Math.round((offscreen === 'below' ? bottom - 3 : CHIP_TOP_MARGIN) + dy) };
    if (!slot.noOp) chip = { ...chip, text: `${text} · ${offscreen === 'below' ? 'lands below ↓' : 'lands above ↑'}` };
  }
  // (And clear of that stand-in.)
  const minY = CHIP_TOP_MARGIN + (offscreen === 'above' ? 6 : 0);
  const maxY = bottom - (offscreen === 'below' ? 8 : 0);
  const room = chipHeight + MOVE_CHIP_MARGIN;
  const above = chipY + room > maxY;
  if (above) {
    let chipBottom = Math.min(chipY + room, maxY);
    // Held up by the bottom of the window, a chip meant to sit below the line (in the ghost) would
    // cover it: it goes just above the line instead.
    if (ghost && !offscreen && chipBottom - chipHeight < lineY + 3) chipBottom = Math.min(chipBottom, lineY - 4);
    chipY = Math.max(minY + room, chipBottom);
  } else {
    chipY = Math.max(minY, chipY);
  }
  return {
    kind: 'move',
    line,
    ghost,
    chip: { ...chip, top: Math.round(chipY + dy), above },
    dim: slot.noOp,
    offscreen,
    attrs: {
      slotKey: slot.slotKey,
      beforeKey: slot.beforeKey,
      atEnd: slot.atEnd,
      position: slot.layout.position,
      width: slot.layout.width,
      align: alignOf(slot.layout),
      wraps: slot.wraps,
      sameSlot: slot.sameSlot,
      noOp: slot.noOp,
      snapped: slot.snapped,
      besideOpposite: slot.besideOpposite,
      pushesDown: slot.pushesDown,
    },
  };
}

function resizeView(
  target: ResizeTarget,
  column: ColumnRect,
  spacer: HTMLElement | null,
  anchorElem: HTMLElement,
  point: GesturePoint,
  /** EXPERIMENT (experiment/iframe-layout-ronny-exp2): this width leaves the widget too small. */
  warning: string | null = null,
): DragView {
  const { dx, dy } = anchorOffset(anchorElem);
  const left = column.left + dx;
  const width = column.width;
  // Along the widget's top edge, kept on screen while a tall widget's top is scrolled away.
  const rect = spacer?.getBoundingClientRect();
  const rulerY = !rect ? point.y : rect.top >= 8 ? rect.top : Math.min(8, rect.bottom - 8);
  // One tick per snap width offered here (none narrower than MIN_WIDGET_WIDTH), measured from the
  // fixed edge; hollow where that width can't wrap here.
  const ticks = target.snaps.map((fraction) => {
    const tickWidth = fraction === 1 ? null : `${Math.round(fraction * 100)}%`;
    const x = target.side === 'left' ? left + (fraction * width) : left + width - (fraction * width);
    return {
      x: Math.round(x),
      fraction,
      label: tickWidth ?? 'Full width',
      filled: tickWidth === null || shouldWrapWidget({ position: target.side, width: tickWidth }, width),
      active: fraction === target.snap,
    };
  });
  // Below the pointer, over the current snap, kept inside the column. Near the bottom of the window,
  // where it would go under the demo's bottom bar or off the screen, it goes above the pointer instead.
  const maxWidth = Math.round(Math.min(260, width));
  const activeX = ticks.find((tick) => tick.active)?.x ?? (point.x + dx);
  const chipX = Math.min(Math.max(activeX, left + (maxWidth / 2)), left + width - (maxWidth / 2));
  const bottomLimit = visibleBottom();
  const above = point.y + RESIZE_CHIP_GAP + RESIZE_CHIP_ROOM + (warning ? CHIP_LINE_HEIGHT : 0) > bottomLimit;
  const chipTop = above ? Math.min(point.y - RESIZE_CHIP_GAP, bottomLimit) : point.y + RESIZE_CHIP_GAP;
  return {
    kind: 'resize',
    ruler: { top: Math.round(rulerY + dy), left: Math.round(left), width: Math.round(width), ticks },
    chip: {
      text: resizeChipText(target, target.wraps && besideOppositeFloat(spacer, target.side)),
      top: Math.round(chipTop + dy), x: Math.round(chipX), align: 'center', maxWidth, above,
      ...(warning ? { warning } : {}),
    },
    attrs: {
      position: target.layout.position,
      width: target.layout.width,
      fixedSide: target.side,
      snap: target.snap,
      wraps: target.wraps,
    },
  };
}

/**
 * Whether a widget on the other side runs beside this one in the live (previewed) layout, squeezing
 * the text between them. Moves warn about this too (DropSlot.besideOpposite).
 */
function besideOppositeFloat(spacer: HTMLElement | null, side: WidgetSide): boolean {
  const parent = spacer?.parentElement;
  if (!spacer || !parent) return false;
  const rect = spacer.getBoundingClientRect();
  return Array.from(parent.children).some((elem) => {
    if (elem === spacer || !(elem instanceof HTMLElement)) return false;
    const float = getComputedStyle(elem).float;
    if ((float !== 'left' && float !== 'right') || float === side) return false;
    const other = elem.getBoundingClientRect();
    return other.top < rect.bottom - 1 && other.bottom > rect.top + 1;
  });
}

/** For screen readers, for example "Right, 33%, before 'One loop and one brake'". */
function describePlacement(
  editor: LexicalEditor,
  key: string,
  layout: IframeWidgetLayout,
  beforeKey: string | null | undefined,
  columnWidth: number,
): string {
  const side = widgetSide(layout);
  const parts = [side ? sideLabel(side) : 'Full width'];
  if (side && layout.width) parts.push(layout.width);
  if (side && alignOf(layout) === 'bottom') parts.push('lined up with the bottom of its paragraph');
  if (side && !shouldWrapWidget(layout, columnWidth)) parts.push('full width at this window size');
  const where = editor.getEditorState().read(() => {
    const widget = $getNodeByKey(key);
    const next = beforeKey === undefined ? (widget && $nextContentSibling(widget))
      : beforeKey === null ? null
      : $getNodeByKey(beforeKey);
    if (!next || $isFootnoteSectionNode(next)) return 'at the end of the post';
    if ($isIframeWidgetNode(next)) return 'before another widget';
    const text = next.getTextContent().replace(/\s+/g, ' ').trim();
    if (!text) return 'before an empty line';
    return `before '${text.length > 48 ? `${text.slice(0, 45).trimEnd()}…` : text}'`;
  });
  return `${parts.join(', ')}, ${where}`;
}
