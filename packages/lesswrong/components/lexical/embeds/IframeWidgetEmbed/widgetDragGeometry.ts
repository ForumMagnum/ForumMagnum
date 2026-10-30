// EXPERIMENT (experiment/iframe-layout-ronny-exp2): the geometry of dragging and resizing iframe
// widgets in the editor: where a drop lands, which side it takes, what a resize snaps to and what the
// chips say. Pure (no DOM, no Lexical), so it is unit tested (unitTests/iframeWidgetDragGeometry.tests.ts).
import {
  alignOf, IframeWidgetLayout, offeredSnapFractions, offeredWidths, sameLayout, shouldWrapWidget, widgetWidthPx, withAlign,
  WRAP_GUTTER,
} from '@/components/contents/iframeWidgetLayout';
import type { IframeWidgetFit } from './iframeResizeScript';

export type WidgetSide = 'left' | 'right';

/** A top-level block of the post, measured in client (viewport) coordinates. */
export interface BlockBox {
  key: string;
  /** Its index among the root's children. */
  index: number;
  /**
   * 'sentinel': an empty, zero-height paragraph the editor keeps on each side of a widget for the
   * caret (BlockCursorNavigationPlugin). Never a drop target; the editor re-adds them after a move.
   * EXPERIMENT (experiment/iframe-layout-ronny-exp3): 'divider' and 'embed' start below a widget the text
   * wraps around (they clear it); a heading sits beside it, but a widget never lines up with one.
   * 'section': a collapsible section. A widget never lines up with its bottom either: opening or closing
   * the section would move the widget.
   */
  kind: 'heading' | 'widget' | 'sentinel' | 'divider' | 'embed' | 'section' | 'other';
  float: 'none' | 'left' | 'right';
  /**
   * It clears the floats before it, so nothing wraps around a float just before it: a full-width
   * widget on the Experiment 2 and 3 pages, or a divider or embed after a widget the text wraps around.
   */
  clears?: boolean;
  top: number;
  bottom: number;
  /**
   * EXPERIMENT (experiment/iframe-layout-ronny-exp3): its bottom margin. A float right after it starts
   * below that, before the next block's top margin (so after a block with none, such as AI content, a
   * float starts above the next block's top). Unknown: at the next block's top.
   */
  marginBottom?: number;
}

/** Blocks in the text flow (floats and sentinels skipped), without the dragged widget. */
function flowBlocks(blocks: BlockBox[], draggedKey: string): BlockBox[] {
  return blocks.filter(b => b.float === 'none' && b.kind !== 'sentinel' && b.key !== draggedKey);
}

/**
 * EXPERIMENT (experiment/iframe-layout-ronny-exp3): whether a widget other than the dragged one already
 * lines up with flow block `i` (floats in front of it, after the flow block before it), or, past the last
 * one, sits at the end. One widget per paragraph (Ronny, Oct 29 2026).
 */
export function widgetLinedUpWith(blocks: BlockBox[], flow: BlockBox[], i: number, draggedKey: string): boolean {
  const from = i > 0 ? flow[i - 1].index : -1;
  const to = i < flow.length ? flow[i].index : Infinity;
  return blocks.some(b => b.float !== 'none' && b.key !== draggedKey && b.index > from && b.index < to);
}

/** The editor's text column, in client coordinates. */
export interface ColumnRect {
  left: number;
  width: number;
}

export interface DropSlot {
  /** The flow block the slot is above, or null for the end of the post. */
  slotKey: string | null;
  /**
   * The top-level block the widget is inserted before, or null for the end of the post: the slot's
   * flow block, or a float at its top (see insertionKey).
   */
  beforeKey: string | null;
  /** The root index the widget lands before (one past the last block at the end of the post). */
  insertIndex: number;
  /** Client y of the insertion line. */
  lineY: number;
  /** The widget's layout after the drop (dragging sideways can switch its side). */
  layout: IframeWidgetLayout;
  /** The widget wraps (floats beside the text) at this column after the drop. */
  wraps: boolean;
  /** The widget would land where it already is (its side may still change). */
  sameSlot: boolean;
  /** Same slot and same layout: dropping changes nothing. */
  noOp: boolean;
  /**
   * Aimed just before a block that clears it (a divider, an embed, a full-width widget), so moved below
   * it (and any more of them right after it).
   */
  snapped: boolean;
  /** What it was moved below, for the chip (the last of them). */
  snappedBelow: ClearingKind | null;
  /**
   * EXPERIMENT (experiment/iframe-layout-ronny-exp3): aimed where another widget is in the way (see
   * WidgetRoom), so moved down to the first spot below that has room, or, with none below, up to the
   * nearest one above.
   */
  moved: 'down' | 'up' | null;
  /** No spot in the post has room for it: dropping it changes nothing. */
  noRoom: boolean;
  /**
   * A full-width drop lands below a float that still runs beside the gap (it clears it), so lineY is
   * moved down to there.
   */
  clearsFloat: boolean;
  /**
   * Client y of the first block after the slot that starts below the widget (a divider, an embed or a
   * full-width widget, which clear it): the ghost stops there. Null if there is none, or the widget
   * doesn't wrap.
   */
  sectionEnd: number | null;
  /**
   * The widget that wraps reaches below where its section's text (narrowed beside it) ends, so the
   * widget itself pushes that block down.
   */
  pushesDown: ClearingKind | null;
  /** The pointer is in the left or right zone of the column (see chooseSide), or neither. */
  pointerSide: WidgetSide | null;
  atEnd: boolean;
  /** Client y of the top of the ghost box, for a drop that wraps. */
  ghostTop: number | null;
}

/** What a block that clears a widget is, for the chips. */
export type ClearingKind = 'divider' | 'embed' | 'heading' | 'widget';

function clearingKind(block: BlockBox): ClearingKind {
  // (EXPERIMENT (experiment/iframe-layout-ronny-exp3): a section heading clears widgets too.)
  return block.kind === 'divider' || block.kind === 'embed' || block.kind === 'heading' ? block.kind : 'widget';
}

/** Floats keep this much space below them (their bottom margin). */
const FLOAT_BOTTOM_MARGIN = 16;
/**
 * EXPERIMENT (experiment/iframe-layout-ronny-exp3): a float starts this far below the top of the block it
 * lines up with (its top margin).
 */
const FLOAT_TOP_MARGIN = 6;

export function widgetSide(layout: IframeWidgetLayout): WidgetSide | null {
  return layout.position === 'left' || layout.position === 'right' ? layout.position : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * The side for a pointer at x: the left 40% of the text column means left, the right 40% means right,
 * and the middle keeps the current side so it doesn't flicker. Outside the column counts as its edge,
 * so on a wide window either page margin picks that side.
 */
export function chooseSide(x: number, column: ColumnRect, current: WidgetSide): WidgetSide {
  return sideZone(x, column) ?? current;
}

function sideZone(x: number, column: ColumnRect): WidgetSide | null {
  if (column.width <= 0) return null;
  const fraction = (clamp(x, column.left, column.left + column.width) - column.left) / column.width;
  return fraction < 0.4 ? 'left' : fraction > 0.6 ? 'right' : null;
}

/**
 * The other blocks as they will be once the dragged widget, a float, has left its place (unless it
 * stays in its slot). A float that was stacked below it moves up, to the top of the block it is anchored
 * at or below the float before it (EXPERIMENT (experiment/iframe-layout-ronny-exp3): on either side, as
 * floats clear both).
 */
function afterLeaving(others: BlockBox[], dragged: BlockBox | undefined, stays: boolean): BlockBox[] {
  if (!dragged || dragged.float === 'none' || stays) return others;
  let lowest = -Infinity;
  return others.map((b) => {
    if (b.float === 'none') return b;
    let moved = b;
    if (b.index > dragged.index) {
      const anchor = (others.find(o => o.float === 'none' && o.index > b.index)?.top ?? b.top) + FLOAT_TOP_MARGIN;
      const top = Math.min(b.top, Math.max(anchor, lowest + FLOAT_BOTTOM_MARGIN + FLOAT_TOP_MARGIN));
      moved = { ...b, top, bottom: b.bottom - b.top + top };
    }
    lowest = Math.max(lowest, moved.bottom);
    return moved;
  });
}

/** The share of the column the text beside a widget with this layout keeps (narrowed, it grows taller by 1 / share). */
function besideShare(layout: IframeWidgetLayout, columnWidth: number): number {
  const beside = columnWidth - (widgetWidthPx(layout, columnWidth) ?? columnWidth) - WRAP_GUTTER;
  return columnWidth > 0 ? clamp(beside / columnWidth, 0, 1) : 1;
}

/**
 * EXPERIMENT (experiment/iframe-layout-ronny-exp3): no two widgets ever share a height (Ronny, Oct 29 2026:
 * "if you passed a horizontal line down the post, it would only ever intersect one widget at a time"). A
 * widget the text wraps around lines up with the top or the bottom of the block after it, and goes only
 * where that leaves it clear of the other widgets the text wraps around: none of them lines up with that
 * block too, one before it has ended by its top, and one after it starts below its bottom. (A full-width
 * widget is a block of its own, which the wrapped text above it ends before.) Everything a widget needs
 * to know about the post for that, measured once per drag frame or key press.
 */
export interface WidgetRoom {
  blocks: BlockBox[];
  key: string;
  /** The text flow without the widget (see flowBlocks). */
  flow: BlockBox[];
  /** The other widgets the text wraps around, where they will be once this one has left its place. */
  floats: BlockBox[];
  height: number;
  /** See besideShare. */
  share: number;
}

/** `stays`: the widget keeps its place (the gear changes how it sits there). */
export function widgetRoom(
  blocks: BlockBox[], key: string, layout: IframeWidgetLayout, columnWidth: number, height: number, stays = false,
): WidgetRoom {
  const others = blocks.filter(b => b.key !== key && b.kind !== 'sentinel');
  return {
    blocks,
    key,
    flow: flowBlocks(blocks, key),
    floats: afterLeaving(others, blocks.find(b => b.key === key), stays).filter(b => b.float !== 'none'),
    height,
    share: besideShare(layout, columnWidth),
  };
}

/**
 * Where a widget the text wraps around lines up: the top or the bottom of flow block `index` (past the
 * last one: the end of the post, beside nothing).
 */
export interface Spot {
  index: number;
  align: 'top' | 'bottom';
}

/**
 * Why a widget can't line up at a spot: it is just before a block that clears it (it would sit beside
 * nothing), the block's bottom isn't a paragraph's, or another widget is in the way. Null: it can.
 */
export function spotProblem(room: WidgetRoom, { index, align }: Spot): 'clears' | 'notParagraph' | 'widget' | null {
  const { blocks, key, flow, floats, height, share } = room;
  const block = flow[index];
  if (block?.clears) return 'clears';
  if (block && align === 'bottom' && block.kind !== 'other') return 'notParagraph';
  if (widgetLinedUpWith(blocks, flow, index, key)) return 'widget';
  // At the end of the post it goes below everything.
  if (!block) return null;
  const before = flow[index - 1];
  const start = (before?.marginBottom !== undefined ? Math.min(before.bottom + before.marginBottom, block.top) : block.top) + FLOAT_TOP_MARGIN;
  const top = align === 'bottom' ? Math.max(start, block.bottom - height) : start;
  // A widget after it starts below it once the text between them wraps around it (narrowed to `share` of
  // the column, that text grows taller). After the next block that clears it, one always does.
  const end = flow.slice(index + 1).find(b => b.clears)?.index ?? Infinity;
  const inTheWay = floats.some(f => f.index < block.index
    ? f.bottom > top + 1
    : f.index < end && f.top - top < height * share);
  return inTheWay ? 'widget' : null;
}

function nextSpot(flow: BlockBox[], { index, align }: Spot): Spot | null {
  if (index >= flow.length) return null;
  return align === 'top' ? { index, align: 'bottom' } : { index: index + 1, align: 'top' };
}

function previousSpot({ index, align }: Spot): Spot | null {
  if (align === 'bottom') return { index, align: 'top' };
  return index > 0 ? { index: index - 1, align: 'bottom' } : null;
}

/**
 * Where a widget aimed at `aim` goes: the first spot from there on down the post that has room for it
 * (below any block that clears it, past any other widget in the way), or with none, the nearest above.
 */
function findSpot(room: WidgetRoom, aim: Spot): { spot: Spot, snappedBelow: ClearingKind | null, moved: DropSlot['moved'] } | null {
  let snappedBelow: ClearingKind | null = null;
  let moved: DropSlot['moved'] = null;
  for (let spot: Spot | null = aim; spot; spot = nextSpot(room.flow, spot)) {
    const problem = spotProblem(room, spot);
    if (!problem) return { spot, snappedBelow, moved };
    if (problem === 'clears') snappedBelow = clearingKind(room.flow[spot.index]);
    if (problem === 'widget') moved = 'down';
  }
  for (let spot = previousSpot(aim); spot; spot = previousSpot(spot)) {
    if (!spotProblem(room, spot)) return { spot, snappedBelow: null, moved: 'up' };
  }
  return null;
}

/**
 * Whether widget `key`, with `layout` (one the text wraps around), has room where it is: no other widget is
 * in the way (see WidgetRoom). For the gear's Left and Right on a full-width widget, its Top and Bottom, and
 * a resize that makes a full-width widget wrap.
 */
export function roomInPlace(blocks: BlockBox[], key: string, layout: IframeWidgetLayout, columnWidth: number, height: number): boolean {
  const self = blocks.find(b => b.key === key);
  if (!self) return true;
  // A full-width widget is a block of its own (below any float still running beside the block before it):
  // once it floats, everything after it moves up into its place.
  let placed = blocks;
  if (self.float === 'none') {
    const before = blocks.filter(b => b.index < self.index && b.float === 'none' && b.kind !== 'sentinel').pop();
    const shift = self.bottom - (before?.bottom ?? self.top);
    placed = blocks.map(b => b.index > self.index ? { ...b, top: b.top - shift, bottom: b.bottom - shift } : b);
  }
  const room = widgetRoom(placed, key, layout, columnWidth, height, true);
  const next = room.flow.findIndex(b => b.index > self.index);
  const index = next < 0 ? room.flow.length : next;
  // (Its own block's bottom only if that is a paragraph's: otherwise it stays at the top, see bottomAlign.)
  const align = alignOf(layout) === 'bottom' && room.flow[index]?.kind === 'other' ? 'bottom' : 'top';
  return spotProblem(room, { index, align }) !== 'widget';
}

/**
 * The block a widget dropped in the slot above flow block `slotKey` is inserted before (null: the end
 * of the post). One that wraps goes right before that block, after any floats at its top, and stacks
 * with them. A full-width one goes before those floats, so they keep the text they wrap around.
 */
export function insertionKey(blocks: BlockBox[], draggedKey: string, slotKey: string | null, wraps: boolean): string | null {
  if (slotKey === null || wraps) return slotKey;
  const at = blocks.findIndex(b => b.key === slotKey);
  let target = slotKey;
  for (let i = at - 1; i >= 0; i--) {
    const b = blocks[i];
    if (b.kind === 'sentinel' || b.key === draggedKey) continue;
    if (b.float === 'none') break;
    target = b.key;
  }
  return target;
}

/** The flow block containing y, or else the nearest one. */
function nearestBlock(flow: BlockBox[], y: number): number {
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < flow.length; i++) {
    const { top, bottom } = flow[i];
    if (y >= top && y <= bottom) return i;
    const distance = y < top ? top - y : y - bottom;
    if (distance < bestDistance) {
      best = i;
      bestDistance = distance;
    }
  }
  return best;
}

export interface DropSlotInput {
  /** The root's children before any footnotes section, in order (the dragged widget among them). */
  blocks: BlockBox[];
  draggedKey: string;
  pointerX: number;
  pointerY: number;
  column: ColumnRect;
  /** The dragged widget's stored layout. */
  layout: IframeWidgetLayout;
  /** The side chosen on the previous frame (null on the first), which the middle band keeps. */
  prevSide: WidgetSide | null;
  /** Height of the ghost box (the widget's height). */
  ghostHeight: number;
}

/**
 * Where a widget dragged to the pointer would land. Drops go between top-level blocks only, and only
 * blocks in the text flow count (floats are skipped), so the slot is before the block under the
 * pointer (above its middle) or before the one after it.
 * EXPERIMENT (experiment/iframe-layout-ronny-exp2): a widget the text wraps around, dragged over the lower
 * half of a paragraph, lines up with that paragraph's bottom instead (align=bottom, still inserted
 * before it); over the upper half, with its top.
 */
export function chooseDropSlot({
  blocks, draggedKey, pointerX, pointerY, column, layout, prevSide, ghostHeight,
}: DropSlotInput): DropSlot {
  const dragged = blocks.find(b => b.key === draggedKey);
  const draggedIndex = dragged?.index ?? -1;
  const flow = flowBlocks(blocks, draggedKey);
  const unsettled = blocks.filter(b => b.key !== draggedKey && b.kind !== 'sentinel');

  // The side follows the pointer, but only for a left/right widget that has room to wrap here;
  // otherwise x is ignored and the stored side is kept for wider screens.
  const storedSide = widgetSide(layout);
  let target = storedSide
    ? { ...layout, position: chooseSide(pointerX, column, prevSide ?? storedSide) }
    : layout;
  const wraps = shouldWrapWidget(target, column.width);
  if (!wraps) target = layout;

  let beforeIndex = 0;
  let align: 'top' | 'bottom' = 'top';
  if (flow.length) {
    const nearest = nearestBlock(flow, pointerY);
    const block = flow[nearest];
    const lowerHalf = pointerY >= (block.top + block.bottom) / 2;
    if (lowerHalf && wraps && block.kind === 'other' && !block.clears && pointerY <= block.bottom) {
      beforeIndex = nearest;
      align = 'bottom';
    } else {
      beforeIndex = lowerHalf ? nearest + 1 : nearest;
    }
  }
  // A widget the text wraps around goes below a block that clears it (a divider, an embed, a full-width
  // widget), never just before it (it would sit beside nothing).
  // EXPERIMENT (experiment/iframe-layout-ronny-exp3): and only where no other widget is in the way (see
  // WidgetRoom): aimed at a spot without room, it moves down to the first one with room.
  let snappedBelow: DropSlot['snappedBelow'] = null;
  let moved: DropSlot['moved'] = null;
  let noRoom = false;
  if (wraps) {
    const found = findSpot(widgetRoom(blocks, draggedKey, target, column.width, ghostHeight), { index: beforeIndex, align });
    if (found) {
      ({ snappedBelow, moved } = found);
      beforeIndex = found.spot.index;
      align = found.spot.align;
    } else {
      noRoom = true;
    }
    target = withAlign(target, align);
  }
  const before = flow[beforeIndex] ?? null;
  const prevFlow = beforeIndex > 0 ? flow[beforeIndex - 1] : null;

  let lineY: number;
  if (before && prevFlow) {
    lineY = (prevFlow.bottom + before.top) / 2;
  } else if (before) {
    lineY = before.top - 4;
  } else {
    // The end of the post: below everything, floats included.
    lineY = unsettled.length ? Math.max(...unsettled.map(b => b.bottom)) + 8 : 0;
  }
  const slotKey = before?.key ?? null;
  const beforeKey = insertionKey(blocks, draggedKey, slotKey, wraps);
  const lastIndex = blocks.length ? blocks[blocks.length - 1].index : -1;
  const insertIndex = blocks.find(b => b.key === beforeKey)?.index ?? (lastIndex + 1);

  // The block the widget sits before now (null at the end); unknown if it isn't a top-level block.
  const origNext = draggedIndex < 0 ? undefined : (flow.find(b => b.index > draggedIndex) ?? null);
  const sameSlot = origNext !== undefined && slotKey === (origNext?.key ?? null);
  const noOp = noRoom || (sameSlot && sameLayout(target, layout));
  // The floats where they will be after the drop (one stacked below the widget may move up).
  const others = afterLeaving(unsettled, dragged, sameSlot);
  // Dropped back on its own slot it doesn't move (only its side changes), so the floats before it are
  // the ones before it now.
  const landsBefore = sameSlot ? draggedIndex : insertIndex;

  // A full-width widget clears every float before it (see the Experiment 2 styles in
  // IframeWidgetPlugin), so where one still runs beside the gap the widget lands below that float:
  // the line goes there, not across the float.
  let clearsFloat = false;
  if (!wraps && before) {
    for (const b of others) {
      if (b.float !== 'none' && b.index < landsBefore && b.bottom > lineY) {
        lineY = Math.max(lineY, b.bottom + (FLOAT_BOTTOM_MARGIN / 2));
        clearsFloat = true;
      }
    }
  }

  let ghostTop: number | null = null;
  let sectionEnd: number | null = null;
  let pushesDown: DropSlot['pushesDown'] = null;
  const side = widgetSide(target);
  if (wraps && side) {
    // (No widget before it reaches down beside it: see WidgetRoom.)
    let top = lineY;
    // Lined up with the paragraph's bottom: as far down as that allows (the paragraph grows a little as
    // its text wraps around the widget, so the drop lands a little lower than this).
    if (align === 'bottom' && before) {
      top = Math.max(top, before.bottom - ghostHeight);
      lineY = before.bottom;
    }
    // The next divider, embed or full-width widget clears the widget once it's dropped, so the widget and
    // whatever floats beside it stop there: a taller widget pushes that block, and every float after it,
    // down below itself.
    const end = flow.slice(beforeIndex + 1).find(b => b.clears);
    if (end) {
      sectionEnd = end.top;
      // Only where the widget, not the text wrapping beside it, decides where that block lands. The
      // section's text below the widget's top (now ending at end.top) gets longer beside it, narrowed
      // to `share` of the column: it then ends at top + (end.top - top) / share, and the widget pushes
      // the block down only if it reaches lower than that.
      if (top + (ghostHeight * besideShare(target, column.width)) > end.top) {
        pushesDown = clearingKind(end);
      }
    }
    ghostTop = top;
  }

  return {
    slotKey,
    beforeKey,
    insertIndex,
    lineY,
    layout: target,
    wraps,
    sameSlot,
    noOp,
    snapped: snappedBelow !== null,
    snappedBelow,
    moved,
    noRoom,
    clearsFloat,
    sectionEnd,
    pushesDown,
    pointerSide: sideZone(pointerX, column),
    atEnd: !before,
    ghostTop,
  };
}

export interface ResizeTarget {
  layout: IframeWidgetLayout;
  /** The side of the widget's fixed edge (a left float keeps its left edge). */
  side: WidgetSide;
  /** The snapped width as a fraction of the column (1 = full width). */
  snap: number;
  /** The widths it can snap to here, as fractions of the column, narrowest first. */
  snaps: number[];
  /** Client x of the fixed edge. */
  fixedEdgeX: number;
  /** The new layout wraps at this column. */
  wraps: boolean;
}

export function nearestSnap(fraction: number, snaps: readonly number[]): number {
  let best = snaps[0];
  for (const snap of snaps) {
    if (Math.abs(fraction - snap) < Math.abs(fraction - best)) best = snap;
  }
  return best;
}

/**
 * The layout for a widget whose `edge` is pulled to pointerX. A float keeps its outer edge and
 * resizes from the text side. A full-width widget pulled in from its right edge becomes a left float,
 * from its left edge a right float. Widths snap to 25/33/38/50% or full width (past 75%), skipping any
 * narrower than MIN_WIDGET_WIDTH in this column.
 */
export function resizeTarget({ edge, startLayout, startWraps, pointerX, column }: {
  edge: WidgetSide,
  startLayout: IframeWidgetLayout,
  /** The widget wrapped (floated) at this column when the resize started. */
  startWraps: boolean,
  pointerX: number,
  column: ColumnRect,
}): ResizeTarget {
  const startSide = widgetSide(startLayout);
  const side: WidgetSide = startWraps && startSide ? startSide : (edge === 'right' ? 'left' : 'right');
  const fixedEdgeX = side === 'left' ? column.left : column.left + column.width;
  const distance = side === 'left' ? pointerX - fixedEdgeX : fixedEdgeX - pointerX;
  const fraction = column.width > 0 ? clamp(distance / column.width, 0, 1) : 1;
  // A float with an in-between width (say 44%) can snap back to it, so pulling an edge out and back
  // leaves it as it was.
  const snaps = offeredSnapFractions(column.width);
  const startWidth = startWraps && startLayout.width?.endsWith('%') ? parseFloat(startLayout.width) / 100 : NaN;
  if (startWidth > 0 && startWidth < 1 && !snaps.some(s => Math.abs(s - startWidth) < 0.005)) {
    snaps.push(startWidth);
    snaps.sort((a, b) => a - b);
  }
  const snap = nearestSnap(fraction, snaps);
  let layout: IframeWidgetLayout;
  if (snap === 1) {
    // Back to full width. A widget that was already full width keeps its stored layout, so a width it
    // only can't use at this window size (say, right 50%) isn't lost.
    layout = startWraps ? { position: 'inline', width: null } : startLayout;
  } else {
    // (A float keeps its alignment, top or bottom of its paragraph.)
    layout = withAlign(
      { position: side, width: snap === startWidth ? startLayout.width : `${Math.round(snap * 100)}%` },
      startWraps ? alignOf(startLayout) : 'top',
    );
  }
  return { layout, side, snap, snaps, fixedEdgeX, wraps: shouldWrapWidget(layout, column.width) };
}

export const AUTO_SCROLL_ZONE = 56;
export const AUTO_SCROLL_MAX_STEP = 18;

/** Pixels to scroll this frame for a drag at clientY: 0, or 1 to 18 up or down near either edge. */
export function autoScrollStep(clientY: number, viewportHeight: number): number {
  const step = (depth: number) => Math.max(1, Math.ceil(AUTO_SCROLL_MAX_STEP * Math.min(1, depth / AUTO_SCROLL_ZONE)));
  const intoTop = AUTO_SCROLL_ZONE - clientY;
  if (intoTop > 0) return -step(intoTop);
  const intoBottom = clientY - (viewportHeight - AUTO_SCROLL_ZONE);
  if (intoBottom > 0) return step(intoBottom);
  return 0;
}

/**
 * The slot one step up or down from the widget's current one, for keyboard moves: the key of the flow
 * block it is above (see insertionKey for where the widget then goes), or null for the end of the
 * post; undefined if there's nowhere to go. For a widget that wraps (`room`, with its alignment kept),
 * slots just before a block that clears it, or where another widget is in the way, are skipped (as in
 * chooseDropSlot).
 */
export function adjacentSlot(
  blocks: BlockBox[], draggedKey: string, direction: 'up' | 'down', room: WidgetRoom | null, align: 'top' | 'bottom' = 'top',
): string | null | undefined {
  const dragged = blocks.find(b => b.key === draggedKey);
  if (!dragged) return undefined;
  const flow = flowBlocks(blocks, draggedKey);
  // (Below a block whose bottom isn't a paragraph's, a widget lined up with bottoms sits at its top, see
  // bottomAlign.)
  const hasRoom = (i: number) => !room || !spotProblem(room, { index: i, align: align === 'bottom' && flow[i]?.kind === 'other' ? 'bottom' : 'top' });
  const candidates: Array<{ key: string | null, index: number }> = [
    ...flow.flatMap((b, i) => hasRoom(i) ? [{ key: b.key, index: b.index }] : []),
    ...(hasRoom(flow.length) ? [{ key: null, index: Infinity }] : []),
  ];
  const current = flow.find(b => b.index > dragged.index)?.index ?? Infinity;
  const next = direction === 'down'
    ? candidates.find(c => c.index > current)
    : [...candidates].reverse().find(c => c.index < current);
  return next ? next.key : undefined;
}

/** The next offered width up or down from `width` (null: full width), or null if there is none. */
export function stepWidth(width: string | null, direction: 1 | -1, columnWidth: number): string | null {
  const value = width ? parseFloat(width) : NaN;
  const current = !width || !(value > 0) ? 100
    : width.endsWith('%') ? value
    : columnWidth > 0 ? 100 * value / columnWidth : 100;
  const options = offeredWidths(columnWidth).map(w => ({ width: w, value: parseFloat(w) }));
  const next = direction > 0
    ? options.find(o => o.value > current + 0.01)
    : [...options].reverse().find(o => o.value < current - 0.01);
  return next?.width ?? null;
}

export function sideLabel(side: WidgetSide): string {
  return side === 'left' ? 'Left' : 'Right';
}

/** What the chip says while a widget is dragged to `slot`. */
export function moveChipText(slot: DropSlot, storedLayout: IframeWidgetLayout): string {
  if (slot.noRoom) return 'No room: every paragraph it could go beside has another widget beside it';
  if (slot.noOp) {
    // Pulled sideways, a full-width widget stays full width: say how to make the text wrap instead.
    return !widgetSide(storedLayout) && slot.pointerSide ? 'Full width · drag an edge to wrap text' : 'No change';
  }
  const side = widgetSide(slot.layout);
  const parts: string[] = [];
  if (slot.atEnd) parts.push('End of post');
  if (slot.snappedBelow) parts.push(`Below the ${slot.snappedBelow}`);
  if (slot.wraps && side) {
    parts.push(`${sideLabel(side)} · ${slot.layout.width}`);
    if (alignOf(slot.layout) === 'bottom') parts.push('bottom of the paragraph');
  } else if (widgetSide(storedLayout)) {
    parts.push('Full width here: no room to wrap');
  } else {
    parts.push('Full width');
  }
  if (slot.moved) parts.push(slot.moved === 'down' ? 'moved down, clear of the widget above' : 'moved up, clear of the widget below');
  if (slot.clearsFloat) parts.push('below the widget beside it');
  if (slot.pushesDown) parts.push(slot.pushesDown === 'widget' ? 'pushes the widget below down' : `pushes the ${slot.pushesDown} down`);
  return parts.join(' · ');
}

/**
 * What the chip says while a widget is resized to `target`. It names the side, which pulling an edge
 * in can change even where the widget still shows full width.
 * EXPERIMENT (experiment/iframe-layout-ronny-exp3): `noRoom`: wrapping here would put it beside another
 * widget (see WidgetRoom), so letting go leaves it full width.
 */
export function resizeChipText(target: ResizeTarget, noRoom = false): string {
  if (target.snap === 1) return 'Full width';
  const label = `${sideLabel(target.side)} · ${Math.round(target.snap * 100)}%`;
  if (noRoom) return `${label}: no room, another widget is beside the text here`;
  if (target.wraps) return label;
  return `${label}: full width at this window size (wraps on wider screens)`;
}

/**
 * A widget too wide for its width is zoomed down to fit (iframeResizeScript.ts), and a chart stretched to
 * fit shrinks its labels with it. The editor warns the widget's author when either leaves it too small:
 * zoomed below SHRINK_WARNING_ZOOM, or any text showing under SHRINK_WARNING_TEXT_PX.
 */
export const SHRINK_WARNING_ZOOM = 0.85;
// 7, not 8: Ronny found the engine diagram's 7.2px bold labels fine (Oct 28 2026).
export const SHRINK_WARNING_TEXT_PX = 7;

/** The warning for a widget shown this small, say "Shrunk to 36% · text 4.7px", or null. */
export function shrinkWarning(fit: IframeWidgetFit | null | undefined): string | null {
  if (!fit) return null;
  const shrunk = fit.zoom < SHRINK_WARNING_ZOOM;
  const tinyText = fit.minText !== null && fit.minText < SHRINK_WARNING_TEXT_PX;
  if (!shrunk && !tinyText) return null;
  const parts: string[] = [];
  if (fit.zoom < 0.995) parts.push(`shrunk to ${Math.round(fit.zoom * 100)}%`);
  if (fit.minText !== null) {
    const size = fit.minText < 10 ? fit.minText.toFixed(1) : String(Math.round(fit.minText));
    // After "shrunk to", plain "text" is enough (and fits under a 25% widget).
    const what = fit.minTextInDrawing ? 'chart labels' : parts.length ? 'text' : 'smallest text';
    parts.push(`${what} ${size}px`);
  }
  const text = parts.join(' · ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Whether a fit measured by the widget's frame still describes it at `width` px (borders aside). */
export function fitMatchesWidth(fit: IframeWidgetFit, width: number): boolean {
  return Math.abs(fit.width - width) <= 3;
}
