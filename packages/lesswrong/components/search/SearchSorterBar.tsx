import React, { useState } from 'react';
import classNames from 'classnames';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter, DragEndEvent, DragStartEvent, DragOverlay, KeyboardCoordinateGetter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, verticalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';
import {
  defaultSearchSort,
  searchSortKeys,
  searchSortToUrlParam,
  SearchSortKey,
  SearchSortSpec,
  moveSearchSort,
  searchSortLabels,
  toggleSearchSortDirection,
} from '@/lib/search/searchSorting';
import LWTooltip from '../common/LWTooltip';

const styles = defineStyles("SearchSorterBar", (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 4,
    overflowX: "auto",
  },
  vertical: {
    flexDirection: "column",
    alignItems: "stretch",
    "& $pill": {justifyContent: "space-between"},
    "& $handle": {flex: 1, textAlign: "left"},
  },
  pill: {
    ...theme.typography.body2,
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 6px 4px 10px",
    fontSize: 14,
    fontWeight: 500,
    color: theme.palette.text.normal,
    backgroundColor: theme.palette.greyAlpha(0.06),
    borderRadius: 3,
    minHeight: 40,
    boxSizing: "border-box",
    whiteSpace: "nowrap",
    cursor: "grab",
    touchAction: "none",
    userSelect: "none",
    "&:focus-visible": {
      outline: `2px solid ${theme.palette.primary.main}`,
      outlineOffset: -2,
    },
  },
  priority: {
    ...theme.typography.body2,
    color: theme.palette.text.dim,
    whiteSpace: "nowrap",
  },
  handle: {
    font: "inherit",
    color: "inherit",
    background: "transparent",
    border: "none",
    minHeight: 40,
    minWidth: 40,
    cursor: "grab",
    touchAction: "none",
    "&:focus-visible": {outline: `2px solid ${theme.palette.primary.main}`},
  },
  overlay: {
    backgroundColor: theme.palette.background.paper,
    boxShadow: `0 4px 16px ${theme.palette.boxShadowColor(0.2)}`,
    cursor: "grabbing",
  },
  reset: {
    ...theme.typography.body2,
    border: "none",
    background: "transparent",
    color: theme.palette.primary.main,
    minHeight: 40,
    padding: "0 8px",
    whiteSpace: "nowrap",
    cursor: "pointer",
    "&:disabled": {opacity: 0.5, cursor: "default"},
  },
  dropTarget: {
    outline: `2px solid ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
  dragging: {
    opacity: 0.4,
    cursor: "grabbing",
  },
  direction: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    border: "none",
    borderRadius: 3,
    background: "transparent",
    color: theme.palette.primary.main,
    fontSize: 16,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.greyAlpha(0.1),
    },
    "&:focus-visible": {
      outline: `2px solid ${theme.palette.primary.main}`,
    },
  },
}));

/** Move to the adjacent pill's center, independent of pill and overlay widths. */
const searchSorterKeyboardCoordinates: KeyboardCoordinateGetter = (event, {context}) => {
  const direction = event.code === "ArrowLeft" ? -1 : event.code === "ArrowRight" ? 1 : 0;
  if (!direction || !context.active || !context.collisionRect) return;
  event.preventDefault();
  const containers = context.droppableContainers.getEnabled()
    .filter(container => context.droppableRects.has(container.id))
    .sort((a, b) => (context.droppableRects.get(a.id)?.left ?? 0) - (context.droppableRects.get(b.id)?.left ?? 0));
  const index = containers.findIndex(container => container.id === (context.over?.id ?? context.active?.id));
  const target = containers[index + direction];
  if (index < 0 || !target) return;
  const rect = context.droppableRects.get(target.id);
  if (!rect) return;
  return {
    x: rect.left + ((rect.width - context.collisionRect.width) / 2),
    y: rect.top + ((rect.height - context.collisionRect.height) / 2),
  };
};

const SorterPill = ({spec, onToggle}: {
  spec: SearchSortSpec,
  onToggle: (key: SearchSortKey) => void,
}) => {
  const classes = useStyles(styles);
  const {attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver} = useSortable({id: spec.key});
  const label = searchSortLabels[spec.key];
  const descending = spec.direction === "desc";
  return <div
    ref={setNodeRef}
    style={{transform: CSS.Transform.toString(transform), transition}}
    className={classNames(classes.pill, {[classes.dragging]: isDragging, [classes.dropTarget]: isOver && !isDragging})}
    data-sort-key={spec.key}
  >
    <button type="button" ref={setActivatorNodeRef} className={classes.handle}
      {...attributes} {...listeners} aria-label={`Reorder ${label}`}
    >{label}</button>
    <button
      type="button"
      className={classes.direction}
      aria-label={`${label}: ${descending ? "descending" : "ascending"}. Reverse`}
      onClick={() => onToggle(spec.key)}
    >
      {descending ? "↓" : "↑"}
    </button>
  </div>;
};

/**
 * Sort keys as draggable pills. Their order is the sort priority; the arrow on
 * each pill reverses that key. Later keys only break ties in earlier keys.
 */
const SearchSorterBar = ({sort, onChange, className, vertical = false}: {
  sort: SearchSortSpec[],
  onChange: (sort: SearchSortSpec[]) => void,
  className?: string,
  vertical?: boolean,
}) => {
  const classes = useStyles(styles);
  const [activeKey, setActiveKey] = useState<SearchSortKey | null>(null);
  const activeSpec = sort.find(spec => spec.key === activeKey);
  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 5}}),
    useSensor(KeyboardSensor, {coordinateGetter: vertical ? sortableKeyboardCoordinates : searchSorterKeyboardCoordinates}),
  );
  const handleDragStart = ({active}: DragStartEvent) => {
    if (searchSortKeys.has(active.id)) setActiveKey(active.id);
  };
  const handleDragEnd = ({active, over}: DragEndEvent) => {
    setActiveKey(null);
    if (!over || active.id === over.id) return;
    if (searchSortKeys.has(active.id) && searchSortKeys.has(over.id)) {
      onChange(moveSearchSort(sort, active.id, over.id));
    }
  };
  const handleToggle = (key: SearchSortKey) => onChange(toggleSearchSortDirection(sort, key));
  return <LWTooltip title="Drag to change priority; later sorters break ties. Focus a label and press Space, then arrow keys, to reorder." placement="bottom-start" inlineBlock={false}>
    <div className={classNames(classes.root, className, {[classes.vertical]: vertical})} role="group" aria-label="Sort priority">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={() => setActiveKey(null)}>
        <SortableContext items={sort.map(spec => spec.key)} strategy={vertical ? verticalListSortingStrategy : horizontalListSortingStrategy}>
          {sort.map((spec, index) => <React.Fragment key={spec.key}>
            <span className={classes.priority}>{index === 0 ? "Sort by" : "then"}</span>
            <SorterPill spec={spec} onToggle={handleToggle} />
          </React.Fragment>)}
        </SortableContext>
        <DragOverlay>
          {activeSpec && <div className={classNames(classes.pill, classes.overlay)} aria-hidden="true">
            {searchSortLabels[activeSpec.key]} {activeSpec.direction === "desc" ? "↓" : "↑"}
          </div>}
        </DragOverlay>
      </DndContext>
      <button type="button" className={classes.reset} disabled={searchSortToUrlParam(sort) === undefined} onClick={() => onChange(defaultSearchSort)}>Reset sorting</button>
    </div>
  </LWTooltip>;
};

export default SearchSorterBar;
