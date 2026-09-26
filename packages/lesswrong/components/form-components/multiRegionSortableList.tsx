import React, { useCallback, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { DragHandleProps } from './sortableList';

/** One list within a MultiRegionSortableList: an id and the ids of its items, in order. */
export interface SortableRegion {
  id: string;
  itemIds: string[];
}

/** A finished drag: which item moved, and where to. */
export interface RegionItemMove {
  itemId: string;
  fromRegionId: string;
  toRegionId: string;
  toIndex: number;
}

const REGION_DROPPABLE_PREFIX = 'region:';

function findRegion(regions: SortableRegion[], itemId: string): SortableRegion | undefined {
  return regions.find((region) => region.itemIds.includes(itemId));
}

/**
 * The regions with an item moved into `toRegionId` at `toIndex` (clamped to
 * the region's length), wherever it was before.
 */
export function moveItemBetweenRegions(regions: SortableRegion[], itemId: string, toRegionId: string, toIndex: number): SortableRegion[] {
  const withoutItem = regions.map((region) => ({ ...region, itemIds: region.itemIds.filter((id) => id !== itemId) }));
  return withoutItem.map((region) => {
    if (region.id !== toRegionId) return region;
    const index = Math.max(0, Math.min(toIndex, region.itemIds.length));
    return { ...region, itemIds: [...region.itemIds.slice(0, index), itemId, ...region.itemIds.slice(index)] };
  });
}

/**
 * The move a drop makes, given the regions before the drag and the preview
 * built while dragging (see `moveItemBetweenRegions`). Dropped on another
 * item in its region, the item takes that item's position; otherwise (on
 * itself, or on an empty region) it stays where the preview put it. Null if
 * it ends where it started.
 */
export function dropMove(regions: SortableRegion[], preview: SortableRegion[], itemId: string, overId: string): RegionItemMove | null {
  const fromRegion = findRegion(regions, itemId);
  const toRegion = findRegion(preview, itemId);
  if (!fromRegion || !toRegion) return null;
  const overIndex = toRegion.itemIds.indexOf(overId);
  const toIndex = overIndex >= 0 ? overIndex : toRegion.itemIds.indexOf(itemId);
  if (fromRegion.id === toRegion.id && fromRegion.itemIds.indexOf(itemId) === toIndex) return null;
  return { itemId, fromRegionId: fromRegion.id, toRegionId: toRegion.id, toIndex };
}

function regionForDragTarget(regions: SortableRegion[], targetId: string): SortableRegion | undefined {
  if (targetId.startsWith(REGION_DROPPABLE_PREFIX)) {
    const regionId = targetId.slice(REGION_DROPPABLE_PREFIX.length);
    return regions.find((region) => region.id === regionId);
  }
  return findRegion(regions, targetId);
}

const SortableRegionItem = ({ itemId, renderItem }: {
  itemId: string,
  renderItem: (itemId: string, dragHandleProps: DragHandleProps, isDragging: boolean) => React.ReactNode,
}) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: itemId });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}>
    {renderItem(itemId, { ref: setActivatorNodeRef, attributes, listeners }, isDragging)}
  </div>;
};

/** A region's items: sortable, and a drop target even when empty. */
const RegionItems = ({ region, renderItem, renderEmptyRegion }: {
  region: SortableRegion,
  renderItem: (itemId: string, dragHandleProps: DragHandleProps, isDragging: boolean) => React.ReactNode,
  renderEmptyRegion?: (regionId: string) => React.ReactNode,
}) => {
  const { setNodeRef } = useDroppable({ id: `${REGION_DROPPABLE_PREFIX}${region.id}` });
  return <SortableContext id={region.id} items={region.itemIds} strategy={verticalListSortingStrategy}>
    <div ref={setNodeRef}>
      {region.itemIds.map((itemId) => <SortableRegionItem key={itemId} itemId={itemId} renderItem={renderItem} />)}
      {region.itemIds.length === 0 && renderEmptyRegion?.(region.id)}
    </div>
  </SortableContext>;
};

/**
 * Several sortable lists (regions) whose items can also be dragged from one
 * region to another, like posts between a sequence's chapters. Unlike
 * `makeSortableListComponent`, which sorts a single list, items can only be
 * dropped inside a region, so whatever the caller renders around each
 * region's items (`renderRegion`, e.g. a heading above and a button below)
 * stays fixed and isn't a drop position.
 *
 * Items are dragged by the handle `renderItem` attaches `dragHandleProps` to.
 * While dragging across regions, a preview shows the item in the region it's
 * over; on drop, `onMove` receives the move, and the caller updates
 * `regions`. `renderEmptyRegion` fills a region with no items, which is still
 * a drop target.
 */
export const MultiRegionSortableList = ({ regions, onMove, renderItem, renderRegion, renderEmptyRegion }: {
  regions: SortableRegion[],
  onMove: (move: RegionItemMove) => void,
  renderItem: (itemId: string, dragHandleProps: DragHandleProps, isDragging: boolean) => React.ReactNode,
  renderRegion: (regionId: string, items: React.ReactNode) => React.ReactNode,
  renderEmptyRegion?: (regionId: string) => React.ReactNode,
}) => {
  const [preview, setPreview] = useState<SortableRegion[] | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = useCallback((_event: DragStartEvent) => {
    setPreview(regions);
  }, [regions]);

  const onDragOver = useCallback(({ active, over }: DragOverEvent) => {
    if (!over || !preview) return;
    const itemId = String(active.id);
    const from = findRegion(preview, itemId);
    const to = regionForDragTarget(preview, String(over.id));
    if (!from || !to || from.id === to.id) return;
    const overIndex = to.itemIds.indexOf(String(over.id));
    setPreview(moveItemBetweenRegions(preview, itemId, to.id, overIndex >= 0 ? overIndex : to.itemIds.length));
  }, [preview]);

  const onDragEnd = useCallback(({ active, over }: DragEndEvent) => {
    const move = preview && over ? dropMove(regions, preview, String(active.id), String(over.id)) : null;
    setPreview(null);
    if (move) {
      onMove(move);
    }
  }, [preview, regions, onMove]);

  const onDragCancel = useCallback(() => setPreview(null), []);

  return <DndContext
    sensors={sensors}
    collisionDetection={closestCorners}
    onDragStart={onDragStart}
    onDragOver={onDragOver}
    onDragEnd={onDragEnd}
    onDragCancel={onDragCancel}
  >
    {(preview ?? regions).map((region) => <React.Fragment key={region.id}>
      {renderRegion(region.id, <RegionItems region={region} renderItem={renderItem} renderEmptyRegion={renderEmptyRegion} />)}
    </React.Fragment>)}
  </DndContext>;
};
