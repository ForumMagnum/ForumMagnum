"use client";

import React, { useState } from 'react';
import classNames from 'classnames';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { ConversationChatView } from './ConversationChatView';
import { researchWarmAlpha, researchUiSans } from './researchStyleUtils';
import {
  MAX_TILES_PER_COLUMN,
  moveTile,
  withColumnWeights,
  withTileWeights,
  type ChatTilingLayout,
} from './chatTilingLayout';

// A column / tile won't be dragged smaller than this (in px) by the resizers.
const MIN_COLUMN_PX = 260;
const MIN_TILE_PX = 140;

// Droppable id encodings (conversationIds, used as draggable ids, never collide
// with these prefixes).
const gutterDropId = (index: number) => `gutter|${index}`;
const slotDropId = (columnId: string, pos: 'top' | 'bottom') => `slot|${columnId}|${pos}`;

const styles = defineStyles('ChatTilingSurface', (theme: ThemeType) => ({
  root: {
    position: 'relative',
    height: '100%',
    display: 'flex',
    flexDirection: 'row',
    minWidth: 0,
    minHeight: 0,
  },
  column: {
    position: 'relative',
    flexBasis: 0,
    minWidth: 0,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  tile: {
    position: 'relative',
    flexBasis: 0,
    minHeight: 0,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  tileDragging: {
    opacity: 0.35,
  },
  // Draggable seam between two columns. A 7px hit area with negative margins so
  // it barely consumes layout width, and a 1px rule drawn down its centre.
  colResizer: {
    flex: '0 0 auto',
    alignSelf: 'stretch',
    width: 7,
    margin: '0 -3px',
    position: 'relative',
    zIndex: 2,
    cursor: 'col-resize',
    '&:before': {
      content: '""',
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 3,
      width: 1,
      background: researchWarmAlpha(0.1),
    },
    '&:hover:before': {
      background: researchWarmAlpha(0.35),
    },
  },
  // Draggable seam between two stacked tiles in a column.
  tileResizer: {
    flex: '0 0 auto',
    height: 7,
    margin: '-3px 0',
    position: 'relative',
    zIndex: 2,
    cursor: 'row-resize',
    '&:before': {
      content: '""',
      position: 'absolute',
      left: 0,
      right: 0,
      top: 3,
      height: 1,
      background: researchWarmAlpha(0.1),
    },
    '&:hover:before': {
      background: researchWarmAlpha(0.35),
    },
  },
  // Applied to whichever resizer is actively being dragged (defined last so its
  // ::before wins on equal specificity with the base seam colour).
  resizerActive: {
    '&:before': {
      background: researchWarmAlpha(0.45),
    },
  },
  // Overlay of drop targets, shown only while a tile is being dragged.
  dropOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 5,
    display: 'flex',
    flexDirection: 'row',
    pointerEvents: 'none',
  },
  dropColumn: {
    flexBasis: 0,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  },
  dropSlot: {
    flex: 1,
    minHeight: 0,
    pointerEvents: 'auto',
    transition: 'background 0.1s ease',
  },
  dropSlotOver: {
    background: researchWarmAlpha(0.14),
    boxShadow: `inset 0 0 0 2px ${researchWarmAlpha(0.4)}`,
  },
  dropGutter: {
    flex: '0 0 auto',
    width: 18,
    pointerEvents: 'auto',
    position: 'relative',
    transition: 'background 0.1s ease',
  },
  dropGutterOver: {
    background: researchWarmAlpha(0.28),
  },
  dragOverlayCard: {
    padding: '6px 12px',
    borderRadius: 6,
    fontFamily: researchUiSans,
    fontSize: 12,
    color: theme.palette.text.primary,
    background: theme.palette.panelBackground.default,
    boxShadow: `0 4px 16px ${researchWarmAlpha(0.4)}`,
    border: `1px solid ${researchWarmAlpha(0.2)}`,
    cursor: 'grabbing',
  },
}));

interface ResizerBarProps {
  axis: 'x' | 'y';
  className: string;
  activeClassName: string;
  weightBefore: number;
  weightAfter: number;
  onResize: (weightBefore: number, weightAfter: number) => void;
}

/**
 * A divider the user drags to repartition the two adjacent tiles/columns. It
 * measures its own previous/next DOM siblings at drag start, so it only ever
 * shifts weight between that one pair — other columns/tiles are untouched.
 */
const ResizerBar = ({ axis, className, activeClassName, weightBefore, weightAfter, onResize }: ResizerBarProps) => {
  const [dragging, setDragging] = useState(false);
  const horizontal = axis === 'x';

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const bar = e.currentTarget;
    const prev = bar.previousElementSibling;
    const next = bar.nextElementSibling;
    if (!(prev instanceof HTMLElement) || !(next instanceof HTMLElement)) return;
    const startPos = horizontal ? e.clientX : e.clientY;
    const prevRect = prev.getBoundingClientRect();
    const nextRect = next.getBoundingClientRect();
    const prevSize = horizontal ? prevRect.width : prevRect.height;
    const nextSize = horizontal ? nextRect.width : nextRect.height;
    const total = prevSize + nextSize;
    const minPx = horizontal ? MIN_COLUMN_PX : MIN_TILE_PX;
    if (total < minPx * 2) return;
    const weightSum = weightBefore + weightAfter;
    setDragging(true);

    const onMove = (move: PointerEvent) => {
      const delta = (horizontal ? move.clientX : move.clientY) - startPos;
      const newPrev = Math.min(total - minPx, Math.max(minPx, prevSize + delta));
      const fraction = newPrev / total;
      onResize(fraction * weightSum, (1 - fraction) * weightSum);
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setDragging(false);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div
      className={classNames(className, dragging && activeClassName)}
      onPointerDown={onPointerDown}
      role="separator"
      aria-orientation={horizontal ? 'vertical' : 'horizontal'}
    />
  );
};

interface DraggableTileProps {
  conversationId: string;
  weight: number;
  projectId: string;
  activeDocumentId: string | null;
  onClose: (conversationId: string) => void;
  onToggleFullscreen: (conversationId: string) => void;
  onOpenInDocument: (conversationId: string) => void;
}

/** One chat tile, draggable by its header (via `dragHandle` threaded into the view). */
const DraggableTile = ({
  conversationId,
  weight,
  projectId,
  activeDocumentId,
  onClose,
  onToggleFullscreen,
  onOpenInDocument,
}: DraggableTileProps) => {
  const classes = useStyles(styles);
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: conversationId,
  });
  return (
    <div
      ref={setNodeRef}
      className={classNames(classes.tile, isDragging && classes.tileDragging)}
      style={{ flexGrow: weight }}
    >
      <ConversationChatView
        conversationId={conversationId}
        projectId={projectId}
        activeDocumentId={activeDocumentId}
        variant="panel"
        onClose={() => onClose(conversationId)}
        onToggleFullscreen={() => onToggleFullscreen(conversationId)}
        onOpenInDocument={() => onOpenInDocument(conversationId)}
        dragHandle={{ setActivatorNodeRef, attributes, listeners }}
      />
    </div>
  );
};

interface DropZoneProps {
  id: string;
  className: string;
  overClassName: string;
}

/** A single droppable region (a column slot or an inter-column gutter). */
const DropZone = ({ id, className, overClassName }: DropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef} className={classNames(className, isOver && overClassName)} />;
};

interface ChatTilingSurfaceProps {
  layout: ChatTilingLayout;
  projectId: string;
  activeDocumentId: string | null;
  onCloseTile: (conversationId: string) => void;
  onToggleFullscreen: (conversationId: string) => void;
  onOpenTileInDocument: (conversationId: string) => void;
  onLayoutChange: (updater: (prev: ChatTilingLayout) => ChatTilingLayout) => void;
}

/**
 * Renders the chat surface's tiling layout: a row of columns, each a vertical
 * stack of chat tiles, with draggable seams between them for resizing and a
 * drag-and-drop layer (active only mid-drag) for rearranging tiles — into
 * another column's top/bottom slot, or into a gutter to spawn a new column.
 */
export const ChatTilingSurface = ({
  layout,
  projectId,
  activeDocumentId,
  onCloseTile,
  onToggleFullscreen,
  onOpenTileInDocument,
  onLayoutChange,
}: ChatTilingSurfaceProps) => {
  const classes = useStyles(styles);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragStart = (event: DragStartEvent) => {
    setDraggingId(String(event.active.id));
  };
  const onDragEnd = (event: DragEndEvent) => {
    const conversationId = String(event.active.id);
    setDraggingId(null);
    const overId = event.over ? String(event.over.id) : null;
    if (!overId) return;
    if (overId.startsWith('gutter|')) {
      const columnIndex = parseInt(overId.slice('gutter|'.length), 10);
      onLayoutChange((prev) => moveTile(prev, conversationId, { columnId: null, columnIndex }));
    } else if (overId.startsWith('slot|')) {
      const [, columnId, pos] = overId.split('|');
      const tileIndex = pos === 'top' ? 0 : MAX_TILES_PER_COLUMN;
      onLayoutChange((prev) => moveTile(prev, conversationId, { columnId, tileIndex }));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDraggingId(null)}
    >
      <div className={classes.root}>
        {layout.columns.map((column, ci) => (
          <React.Fragment key={column.id}>
            {ci > 0 && (
              <ResizerBar
                axis="x"
                className={classes.colResizer}
                activeClassName={classes.resizerActive}
                weightBefore={layout.columns[ci - 1].weight}
                weightAfter={column.weight}
                onResize={(before, after) =>
                  onLayoutChange((prev) =>
                    withColumnWeights(prev, { [layout.columns[ci - 1].id]: before, [column.id]: after }))}
              />
            )}
            <div className={classes.column} style={{ flexGrow: column.weight }}>
              {column.tiles.map((tile, ti) => (
                <React.Fragment key={tile.conversationId}>
                  {ti > 0 && (
                    <ResizerBar
                      axis="y"
                      className={classes.tileResizer}
                      activeClassName={classes.resizerActive}
                      weightBefore={column.tiles[ti - 1].weight}
                      weightAfter={tile.weight}
                      onResize={(before, after) =>
                        onLayoutChange((prev) =>
                          withTileWeights(prev, column.id, {
                            [column.tiles[ti - 1].conversationId]: before,
                            [tile.conversationId]: after,
                          }))}
                    />
                  )}
                  <DraggableTile
                    conversationId={tile.conversationId}
                    weight={tile.weight}
                    projectId={projectId}
                    activeDocumentId={activeDocumentId}
                    onClose={onCloseTile}
                    onToggleFullscreen={onToggleFullscreen}
                    onOpenInDocument={onOpenTileInDocument}
                  />
                </React.Fragment>
              ))}
            </div>
          </React.Fragment>
        ))}

        {draggingId ? (
          <div className={classes.dropOverlay}>
            <DropZone id={gutterDropId(0)} className={classes.dropGutter} overClassName={classes.dropGutterOver} />
            {layout.columns.map((column, ci) => (
              <React.Fragment key={column.id}>
                <div className={classes.dropColumn} style={{ flexGrow: column.weight }}>
                  <DropZone id={slotDropId(column.id, 'top')} className={classes.dropSlot} overClassName={classes.dropSlotOver} />
                  {column.tiles.length > 1 && (
                    <DropZone id={slotDropId(column.id, 'bottom')} className={classes.dropSlot} overClassName={classes.dropSlotOver} />
                  )}
                </div>
                <DropZone id={gutterDropId(ci + 1)} className={classes.dropGutter} overClassName={classes.dropGutterOver} />
              </React.Fragment>
            ))}
          </div>
        ) : null}
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingId ? <div className={classes.dragOverlayCard}>Move chat…</div> : null}
      </DragOverlay>
    </DndContext>
  );
};
