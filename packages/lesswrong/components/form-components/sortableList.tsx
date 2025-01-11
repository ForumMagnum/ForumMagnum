import React, {useCallback} from 'react';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';
// These imports need to be separate to satisfy eslint, for some reason
import type {SortableContainerProps, SortEvent, SortEventWithTag} from 'react-sortable-hoc';
import * as _ from 'underscore';

export function makeSortableListComponent<Styles extends AnyStyles>({renderItem}: {
  renderItem: ({contents, removeItem, classes}: { contents: string, removeItem: (id: string) => void, classes: ClassesType<Styles> }) => React.ReactNode
}) {
  // For some reason the SortableElement HoC's type annotation, under React 18,
  // doesn't accurately reflect the fact that extra parameters get passed
  // through to the underlying component. (In React 16 this wasn't an issue, and
  // it typechecked there without needing this `any` annotation)
  // eslint-disable-next-line babel/new-cap
  const SortableItem: AnyBecauseHard = SortableElement(({contents, removeItem, classes}: {
    contents: string,
    removeItem: (id: string) => void,
    classes: ClassesType<Styles>
  }) => <>
    {renderItem({contents, removeItem, classes})}
  </>);
  // eslint-disable-next-line babel/new-cap
  const SortableList: any = SortableContainer(({items, removeItem, className, classes}: {
    items: string[],
    removeItem: (id: string) => void,
    className?: string,
    classes: ClassesType<Styles>
  }) => {
    return <span className={className}>
      {items.map((contents, index) => {
        return <SortableItem key={`item-${index}`} removeItem={removeItem} index={index} contents={contents} classes={classes}/>
      })}
    </span>
  });
  
  const shouldCancelStart = (e: SortEvent | SortEventWithTag) => {
    // Cancel drag if the event target is a form field, so that if the draggable
    // things have form fields inside them, you can still click to focus them.
    const disabledElements = [ 'input', 'textarea', 'select', 'option', 'button', 'svg', 'path' ];
    if ('tagName' in e.target && disabledElements.includes(e.target.tagName.toLowerCase())) {
      return true; // Return true to cancel sorting
    } else {
      return false;
    }
  }
  
  return (props: {
    value: string[],
    setValue: (value: string[]) => void,
    className?: string,
    classes: ClassesType<Styles>,
  } & SortableContainerProps) => {
    const {value, setValue, className, ...otherProps} = props;
    
    const onSortEnd = useCallback(({oldIndex, newIndex}: {oldIndex: number, newIndex: number}) => {
      setValue(arrayMove(value, oldIndex, newIndex));
    }, [value, setValue]);
    const removeItem = useCallback((item: string) => {
      setValue(_.without(value, item));
    }, [value, setValue]);
    
    return <SortableList
      {...otherProps}
      className={className}
      items={value||[]}
      onSortEnd={onSortEnd}
      removeItem={removeItem}
      shouldCancelStart={shouldCancelStart}
    />
  };
}
