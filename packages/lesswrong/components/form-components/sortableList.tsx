import React, { useCallback } from 'react';
import type { ReactNode } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter, DragEndEvent, KeyboardSensor, Modifiers, MouseSensor, DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, verticalListSortingStrategy, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import without from 'lodash/without';

/**
 * Props that the caller can attach to whichever element should act as the
 * drag handle. Spread them onto a single element (e.g. an icon) to scope
 * drag activation to that element instead of the whole item.
 */
export interface DragHandleProps {
  ref: (node: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
}

interface RenderItemArgsBase {
  contents: string;
  removeItem: (id: string) => void;
}

interface RenderItemArgsWithHandle extends RenderItemArgsBase {
  dragHandleProps: DragHandleProps;
}

type MakeSortableListComponentArgs =
  | {
      RenderItem: (args: RenderItemArgsBase) => ReactNode;
      customDragHandle?: never;
    }
  | {
      RenderItem: (args: RenderItemArgsWithHandle) => ReactNode;
      customDragHandle: true;
    };

/**
 * Create a sortable list component that wraps some arbitrary render
 * function. `RenderItem` receives the item's `contents` (usually an id) and a
 * function that allows the item to remove itself from the list.
 *
 * By default, the entire item wrapper is the drag activator. Pass
 * `customDragHandle: true` to suppress that and instead receive a
 * `dragHandleProps` bag in `RenderItem`; spread it onto whatever element you
 * want to act as the handle. This is the right choice when the item contains
 * text, form fields, or other interactive content that would otherwise be
 * hijacked by the drag listeners.
 */
export function makeSortableListComponent(args: MakeSortableListComponentArgs) {
  const SortableItem = ({ id, removeItem }: {
    id: string;
    removeItem: (id: string) => void;
  }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      setActivatorNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style: React.CSSProperties = {
      transform: CSS.Transform.toString(transform),
      transition,
      cursor: args.customDragHandle ? undefined : 'grab',
      opacity: isDragging ? 0.7 : 1,
    };

    if (args.customDragHandle) {
      const dragHandleProps: DragHandleProps = {
        ref: setActivatorNodeRef,
        attributes,
        listeners,
      };
      return <span ref={setNodeRef} style={style}>
        <args.RenderItem contents={id} removeItem={removeItem} dragHandleProps={dragHandleProps} />
      </span>;
    }

    return <span ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <args.RenderItem contents={id} removeItem={removeItem} />
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
