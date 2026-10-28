// EXPERIMENT (experiment/iframe-layout-ronny-exp2): the geometry of dragging and resizing iframe
// widgets in the editor: where a drop lands, which side it takes, what a resize snaps to and what the
// chips say. Pure (no DOM, no Lexical), so it is unit tested (unitTests/iframeWidgetDragGeometry.tests.ts).
import {
  IframeWidgetLayout, offeredSnapFractions, offeredWidths, sameLayout, shouldWrapWidget, widgetWidthPx, WRAP_GUTTER,
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
   */
  kind: 'heading' | 'widget' | 'sentinel' | 'other';
  float: 'none' | 'left' | 'right';
  /**
   * It clears the floats before it, so nothing wraps around a float just before it: a full-width
   * widget on the Experiment 2 page, or a heading after a widget the text wraps around.
   */
  clears?: boolean;
  top: number;
  bottom: number;
}

/** Blocks in the text flow (floats and sentinels skipped), without the dragged widget. */
function flowBlocks(blocks: BlockBox[], draggedKey: string): BlockBox[] {
  return blocks.filter(b => b.float === 'none' && b.kind !== 'sentinel' && b.key !== draggedKey);
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
   * Aimed just before a heading or a full-width widget, so moved below it (and any more of them right
   * after it).
   */
  headingSnapped: boolean;
  /** What it was moved below, for the chip (the last of them). */
  snappedBelow: 'heading' | 'widget' | null;
  /**
   * A full-width drop lands below a float that still runs beside the gap (it clears it), so lineY is
   * moved down to there.
   */
  clearsFloat: boolean;
  /** A drop that wraps stacks below an earlier float on its side, so the ghost is below the line. */
  stacked: boolean;
  /** A float on the other side would sit beside it, squeezing the text between them. */
  besideOpposite: boolean;
  /**
   * Client y of the first block after the slot that starts a new section below the widget (a heading,
   * which then clears it, or a full-width widget): the ghost stops there. Null if there is none, or
   * the widget doesn't wrap.
   */
  sectionEnd: number | null;
  /**
   * The widget that wraps reaches below where its section's text (narrowed beside it) ends, so the
   * widget itself pushes that block down.
   */
  pushesDown: 'heading' | 'widget' | null;
  /** The pointer is in the left or right zone of the column (see chooseSide), or neither. */
  pointerSide: WidgetSide | null;
  atEnd: boolean;
  /** Client y of the top of the ghost box, for a drop that wraps. */
  ghostTop: number | null;
}

/** Floats keep this much space below them (their bottom margin). */
const FLOAT_BOTTOM_MARGIN = 16;

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
 * stays: same slot, same side). A float that was stacked below it on its side moves up, to the top of
 * the block it is anchored at or below the float before it on that side, so it may end up beside the
 * dropped widget.
 */
function afterLeaving(others: BlockBox[], dragged: BlockBox | undefined, stays: boolean): BlockBox[] {
  if (!dragged || dragged.float === 'none' || stays) return others;
  const lowest = { left: -Infinity, right: -Infinity };
  return others.map((b) => {
    if (b.float === 'none') return b;
    let moved = b;
    if (b.float === dragged.float && b.index > dragged.index) {
      const anchor = others.find(o => o.float === 'none' && o.index > b.index)?.top ?? b.top;
      const top = Math.min(b.top, Math.max(anchor, lowest[b.float] + FLOAT_BOTTOM_MARGIN));
      moved = { ...b, top, bottom: b.bottom - b.top + top };
    }
    lowest[b.float] = Math.max(lowest[b.float], moved.bottom);
    return moved;
  });
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
  if (flow.length) {
    const nearest = nearestBlock(flow, pointerY);
    const block = flow[nearest];
    beforeIndex = pointerY < (block.top + block.bottom) / 2 ? nearest : nearest + 1;
  }
  // A widget the text wraps around goes below a heading or a full-width widget, never just before it
  // (that block would clear it and leave it beside nothing).
  let snappedBelow: DropSlot['snappedBelow'] = null;
  if (wraps) {
    while (beforeIndex < flow.length && (flow[beforeIndex].kind === 'heading' || flow[beforeIndex].clears)) {
      snappedBelow = flow[beforeIndex].kind === 'heading' ? 'heading' : 'widget';
      beforeIndex++;
    }
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
  const noOp = sameSlot && sameLayout(target, layout);
  // The floats where they will be after the drop (one stacked below the widget may move up).
  const others = afterLeaving(unsettled, dragged, sameSlot && dragged?.float === widgetSide(target));
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
  let besideOpposite = false;
  let sectionEnd: number | null = null;
  let pushesDown: DropSlot['pushesDown'] = null;
  const side = widgetSide(target);
  if (wraps && side) {
    // It clears earlier floats on its own side, so it stacks below them.
    let top = lineY;
    for (const b of others) {
      if (b.float === side && b.index < landsBefore) {
        top = Math.max(top, b.bottom + FLOAT_BOTTOM_MARGIN);
      }
    }
    // The next heading clears the widget once it's dropped (as does a full-width widget), so the
    // widget and whatever floats beside it stop there: a taller widget pushes that block, and every
    // float after it, down below itself.
    const end = flow.slice(beforeIndex + 1).find(b => b.kind === 'heading' || b.clears);
    const bottom = top + ghostHeight;
    besideOpposite = others.some(b => b.float !== 'none' && b.float !== side && (!end || b.index < end.index)
      && b.top < bottom && b.bottom > top);
    if (end) {
      sectionEnd = end.top;
      // Only where the widget, not the text wrapping beside it, decides where that block lands. The
      // section's text below the widget's top (now ending at end.top) gets longer beside it, narrowed
      // to `share` of the column: it then ends at top + (end.top - top) / share, and the widget pushes
      // the block down only if it reaches lower than that.
      const beside = column.width - (widgetWidthPx(target, column.width) ?? column.width) - WRAP_GUTTER;
      const share = column.width > 0 ? clamp(beside / column.width, 0, 1) : 1;
      if (top + (ghostHeight * share) > end.top) {
        pushesDown = end.kind === 'heading' ? 'heading' : 'widget';
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
    headingSnapped: snappedBelow !== null,
    snappedBelow,
    clearsFloat,
    stacked: ghostTop !== null && ghostTop > lineY + 1,
    besideOpposite,
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
    layout = { position: side, width: snap === startWidth ? startLayout.width : `${Math.round(snap * 100)}%` };
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
 * post; undefined if there's nowhere to go. For a widget that wraps, slots just before a heading or a
 * full-width widget are skipped (as in chooseDropSlot).
 */
export function adjacentSlot(blocks: BlockBox[], draggedKey: string, direction: 'up' | 'down', wraps: boolean): string | null | undefined {
  const dragged = blocks.find(b => b.key === draggedKey);
  if (!dragged) return undefined;
  const flow = flowBlocks(blocks, draggedKey);
  const candidates: Array<{ key: string | null, index: number }> = [
    ...flow.filter(b => !(wraps && (b.kind === 'heading' || b.clears))).map(b => ({ key: b.key, index: b.index })),
    { key: null, index: Infinity },
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
  if (slot.noOp) {
    // Pulled sideways, a full-width widget stays full width: say how to make the text wrap instead.
    return !widgetSide(storedLayout) && slot.pointerSide ? 'Full width · drag an edge to wrap text' : 'No change';
  }
  const side = widgetSide(slot.layout);
  const parts: string[] = [];
  if (slot.atEnd) parts.push('End of post');
  if (slot.snappedBelow) parts.push(slot.snappedBelow === 'heading' ? 'Below the heading' : 'Below the widget');
  if (slot.wraps && side) {
    parts.push(`${sideLabel(side)} · ${slot.layout.width}`);
  } else if (widgetSide(storedLayout)) {
    parts.push('Full width here: no room to wrap');
  } else {
    parts.push('Full width');
  }
  if (slot.stacked) parts.push('below the widget on that side');
  if (slot.clearsFloat) parts.push('below the widget beside it');
  if (slot.besideOpposite) parts.push('beside another widget: text gets narrow');
  if (slot.pushesDown) parts.push(slot.pushesDown === 'heading' ? 'pushes the heading down' : 'pushes the widget below down');
  return parts.join(' · ');
}

/**
 * What the chip says while a widget is resized to `target`. It names the side, which pulling an edge
 * in can change even where the widget still shows full width.
 */
export function resizeChipText(target: ResizeTarget, besideOpposite = false): string {
  if (target.snap === 1) return 'Full width';
  const label = `${sideLabel(target.side)} · ${Math.round(target.snap * 100)}%`;
  if (target.wraps) return besideOpposite ? `${label} · beside another widget: text gets narrow` : label;
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
