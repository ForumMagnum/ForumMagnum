import React, {useCallback} from 'react';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';
import * as _ from 'underscore';

export const makeSortableListComponent = ({renderItem}: {
  renderItem: ({contents, removeItem, classes}: { contents: string, removeItem: (id:string)=>void, classes: ClassesType }) => React.ReactNode
}) => {
  // eslint-disable-next-line babel/new-cap
  const SortableItem = SortableElement(({contents, removeItem, classes}) => <>
    {renderItem({contents, removeItem, classes})}
  </>);
  // eslint-disable-next-line babel/new-cap
  const SortableList = SortableContainer(({items, removeItem, className, classes}) => {
    return <span className={className}>
      {items.map((contents, index) => {
        return <SortableItem key={`item-${index}`} removeItem={removeItem} index={index} contents={contents} classes={classes}/>
      })}
    </span>
  });
  
  const shouldCancelStart = (e) => {
    // Cancel drag if the event target is a form field, so that if the draggable
    // things have form fields inside them, you can still click to focus them.
    const disabledElements = [ 'input', 'textarea', 'select', 'option', 'button', 'svg', 'path' ];
    if (disabledElements.includes(e.target.tagName.toLowerCase())) {
      return true; // Return true to cancel sorting
    } else {
      return false;
    }
  }
  
  return (props) => {
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
