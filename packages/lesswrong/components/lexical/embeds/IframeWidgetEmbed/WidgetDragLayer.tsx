'use client';
// EXPERIMENT (experiment/iframe-layout-ronny-exp2): what the editor shows while a widget is dragged or
// resized: the drop line, a ghost box where a wrapping widget would land, the snap ruler and a chip that
// says what letting go will do. It lives in the editor's anchor element (anchor coordinates) and never
// takes pointer events. The data-* attributes on the indicator are test hooks.
import React, { useSyncExternalStore } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface DragChip {
  text: string;
  /** y of the chip's top edge, or of its bottom edge when `above`. */
  top: number;
  /** x of the chip's left edge, right edge or center, by `align`. */
  x: number;
  align: 'start' | 'end' | 'center';
  maxWidth: number;
  /** The chip sits above `top` (near the bottom of the window), so its height doesn't matter. */
  above?: boolean;
}

export interface MoveDragView {
  kind: 'move';
  line: { top: number, left: number, width: number };
  /** cut: stopped where the next section starts, which the widget pushes down (no bottom edge). */
  ghost: { top: number, left: number, width: number, height: number, cut: boolean } | null;
  chip: DragChip;
  /** The drop changes nothing: the line is dimmed. */
  dim: boolean;
  /** The slot is out of view this way: the line is a dashed stand-in at that edge of the window. */
  offscreen: 'above' | 'below' | null;
  attrs: {
    /** The text-flow block the slot is above (null: the end of the post). */
    slotKey: string | null,
    /** The top-level block the widget will be inserted before: the slot's block or a float at its top. */
    beforeKey: string | null,
    atEnd: boolean,
    position: string,
    width: string | null,
    wraps: boolean,
    sameSlot: boolean,
    noOp: boolean,
    headingSnapped: boolean,
    besideOpposite: boolean,
    pushesDown: 'heading' | 'widget' | null,
  };
}

export interface ResizeDragView {
  kind: 'resize';
  ruler: {
    top: number,
    left: number,
    width: number,
    ticks: Array<{ x: number, fraction: number, label: string, filled: boolean, active: boolean }>,
  };
  chip: DragChip;
  attrs: {
    position: string,
    width: string | null,
    /** The side of the edge that stays put. */
    fixedSide: string,
    snap: number,
    wraps: boolean,
  };
}

export type DragView = MoveDragView | ResizeDragView;

/**
 * Holds the current view outside React state, so the per-frame updates of a drag re-render only the
 * layer (and only when something it shows changed).
 */
export class DragViewStore {
  private view: DragView | null = null;
  private signature = '';
  private listeners = new Set<() => void>();

  get = (): DragView | null => this.view;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  set(view: DragView | null): void {
    const signature = view ? JSON.stringify(view) : '';
    if (signature === this.signature) return;
    this.signature = signature;
    this.view = view;
    this.listeners.forEach(listener => listener());
  }
}

/**
 * The primary color at this opacity. (The palette's primaryAlpha is its greyAlpha, so it gives grey.)
 */
export function primaryTint(theme: ThemeType, alpha: number): string {
  return `color-mix(in srgb, ${theme.palette.primary.main} ${Math.round(alpha * 100)}%, transparent)`;
}

const styles = defineStyles('WidgetDragLayer', (theme: ThemeType) => ({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    zIndex: 5,
    pointerEvents: 'none',
  },
  line: {
    position: 'absolute',
    height: 3,
    marginTop: -1.5,
    borderRadius: 2,
    background: theme.palette.primary.main,
  },
  lineDim: {
    opacity: 0.35,
  },
  lineEdge: {
    height: 0,
    marginTop: 0,
    borderRadius: 0,
    background: 'none',
    borderTop: `3px dashed ${theme.palette.primary.main}`,
  },
  ghost: {
    position: 'absolute',
    boxSizing: 'border-box',
    border: `2px dashed ${theme.palette.primary.main}`,
    borderRadius: 4,
    background: primaryTint(theme, 0.06),
  },
  ghostCut: {
    borderBottom: 'none',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  chip: {
    position: 'absolute',
    boxSizing: 'border-box',
    padding: '2px 9px',
    borderRadius: 11,
    border: `1px solid ${theme.palette.primary.main}`,
    background: theme.palette.panelBackground.default,
    boxShadow: `0 1px 4px ${theme.palette.boxShadowColor(0.15)}`,
    ...theme.typography.body2,
    fontSize: 12,
    lineHeight: '18px',
    color: theme.palette.text.normal,
    width: 'max-content',
    whiteSpace: 'normal',
  },
  // A thin line with a light halo, so it reads as a control rather than a line struck through the text
  // and the widget under it, while the text under it stays readable; only the ticks get a solid ring.
  ruler: {
    position: 'absolute',
    height: 2,
    marginTop: -0.5,
    borderRadius: 1,
    background: theme.palette.primary.main,
    boxShadow: `0 0 0 1.5px ${theme.palette.panelBackground.default}`,
  },
  tick: {
    position: 'absolute',
    top: -3,
    width: 8,
    height: 8,
    marginLeft: -4,
    boxSizing: 'border-box',
    borderRadius: '50%',
    background: theme.palette.primary.main,
    border: `1.5px solid ${theme.palette.primary.main}`,
    boxShadow: `0 0 0 2px ${theme.palette.panelBackground.default}`,
  },
  tickHollow: {
    background: theme.palette.panelBackground.default,
  },
  tickActive: {
    top: -5,
    width: 12,
    height: 12,
    marginLeft: -6,
    boxShadow: `0 0 0 2px ${theme.palette.panelBackground.default}, 0 0 0 5px ${primaryTint(theme, 0.3)}`,
  },
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    margin: -1,
    padding: 0,
    border: 0,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
  },
}));

function Chip({ chip }: { chip: DragChip }) {
  const classes = useStyles(styles);
  const shiftX = chip.align === 'end' ? '-100%' : chip.align === 'center' ? '-50%' : '0';
  return <div
    className={classes.chip}
    style={{ top: chip.top, left: chip.x, maxWidth: chip.maxWidth, transform: `translate(${shiftX}, ${chip.above ? '-100%' : '0'})` }}
    data-testid="widget-drag-chip"
    data-above={String(!!chip.above)}
  >{chip.text}</div>;
}

function MoveIndicator({ view }: { view: MoveDragView }) {
  const classes = useStyles(styles);
  const { attrs } = view;
  return <div
    className={classes.layer}
    data-testid="widget-drop-indicator"
    data-kind="move"
    data-slot-key={attrs.slotKey ?? ''}
    data-before-key={attrs.beforeKey ?? ''}
    data-at-end={String(attrs.atEnd)}
    data-position={attrs.position}
    data-side={attrs.position === 'left' || attrs.position === 'right' ? attrs.position : 'none'}
    data-width={attrs.width ?? ''}
    data-wraps={String(attrs.wraps)}
    data-same-slot={String(attrs.sameSlot)}
    data-noop={String(attrs.noOp)}
    data-heading-snapped={String(attrs.headingSnapped)}
    data-beside-opposite={String(attrs.besideOpposite)}
    data-pushes-down={attrs.pushesDown ?? ''}
    data-offscreen={view.offscreen ?? ''}
    data-chip={view.chip.text}
  >
    <div
      className={classNames(classes.line, view.dim && classes.lineDim, view.offscreen && classes.lineEdge)}
      style={view.line}
      data-testid="widget-drop-line"
      data-dim={String(view.dim)}
    />
    {view.ghost && <div
      className={classNames(classes.ghost, view.ghost.cut && classes.ghostCut)}
      style={{ top: view.ghost.top, left: view.ghost.left, width: view.ghost.width, height: view.ghost.height }}
      data-testid="widget-drop-ghost"
      data-cut={String(view.ghost.cut)}
    />}
    <Chip chip={view.chip}/>
  </div>;
}

function ResizeIndicator({ view }: { view: ResizeDragView }) {
  const classes = useStyles(styles);
  const { attrs, ruler } = view;
  return <div
    className={classes.layer}
    data-testid="widget-drop-indicator"
    data-kind="resize"
    data-position={attrs.position}
    data-side={attrs.position === 'left' || attrs.position === 'right' ? attrs.position : 'none'}
    data-width={attrs.width ?? ''}
    data-fixed-side={attrs.fixedSide}
    data-snap={String(attrs.snap)}
    data-wraps={String(attrs.wraps)}
    data-chip={view.chip.text}
  >
    <div
      className={classes.ruler}
      style={{ top: ruler.top, left: ruler.left, width: ruler.width }}
      data-testid="widget-resize-ruler"
    >
      {ruler.ticks.map(tick => <div
        key={tick.fraction}
        className={classNames(classes.tick, !tick.filled && classes.tickHollow, tick.active && classes.tickActive)}
        style={{ left: tick.x - ruler.left }}
        data-testid="widget-resize-tick"
        data-fraction={String(tick.fraction)}
        data-label={tick.label}
        data-filled={String(tick.filled)}
        data-active={String(tick.active)}
      />)}
    </div>
    <Chip chip={view.chip}/>
  </div>;
}

export const WidgetDragLayer = React.memo(function WidgetDragLayer({ store, announcement }: {
  store: DragViewStore,
  /** Read out by screen readers (keyboard moves, drops). */
  announcement: string,
}) {
  const classes = useStyles(styles);
  const view = useSyncExternalStore(store.subscribe, store.get, () => null);
  return <>
    {view?.kind === 'move' && <MoveIndicator view={view}/>}
    {view?.kind === 'resize' && <ResizeIndicator view={view}/>}
    <div className={classes.visuallyHidden} aria-live="polite" data-testid="widget-drag-announce">{announcement}</div>
  </>;
});
