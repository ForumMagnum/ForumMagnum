import React, { useCallback } from 'react';
import type { ReactNode } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, DragEndEvent, KeyboardSensor, Modifiers, MouseSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, verticalListSortingStrategy, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import without from 'lodash/without';

/**
 * Create a sortable list component that wraps some arbitrary render
 * function. `RenderItem` receives the item's `contents` (usually an id) and a
 * function that allows the item to remove itself from the list.
 */
export function makeSortableListComponent({ RenderItem }: {
  RenderItem: (args: { contents: string, removeItem: (id: string) => void }) => ReactNode;
}) {
  const SortableItem = ({ id, removeItem }: {
    id: string;
    removeItem: (id: string) => void;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      cursor: 'grab',
      opacity: isDragging ? 0.7 : 1,
    };

    return <span ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <RenderItem contents={id} removeItem={removeItem} />
    </span>;
  };

  return ({
    value,
    setValue,
    className,
    axis = 'y',
    modifiers,
    sensors: sensorsProp,
  }: {
    value: string[];
    setValue: (value: string[]) => void;
    className?: string;
    axis?: 'x' | 'y' | 'xy';
    modifiers?: Modifiers;
    sensors?: ReturnType<typeof useSensors>;
  }) => {
    const mouse = useSensor(MouseSensor, { activationConstraint: { distance: 5 } });
    const pointer = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
    const keyboard = useSensor(KeyboardSensor);
    const defaultSensors = useSensors(mouse, pointer, keyboard);
    const sensors = sensorsProp ?? defaultSensors;

    const strategy =
      axis === 'x'
        ? horizontalListSortingStrategy
        : axis === 'xy'
        ? rectSortingStrategy
        : verticalListSortingStrategy;

    const handleDragEnd = useCallback(({ active, over }: DragEndEvent) => {
      if (over && active.id !== over.id) {
        const oldIndex = value.indexOf(active.id as string);
        const newIndex = value.indexOf(over.id as string);
        if (oldIndex !== -1 && newIndex !== -1) {
          setValue(arrayMove(value, oldIndex, newIndex));
        }
      }
    }, [value, setValue]);

    const removeItem = useCallback((itemId: string) => {
      setValue(without(value, itemId));
    }, [value, setValue]);

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={value ?? []} strategy={strategy}>
          <span className={className}>
            {(value ?? []).map((id) => (
              <SortableItem key={id} id={id} removeItem={removeItem} />
            ))}
          </span>
        </SortableContext>
      </DndContext>
    );
  };
}
