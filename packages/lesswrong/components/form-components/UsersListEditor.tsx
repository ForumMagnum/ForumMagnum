import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { withStyles, createStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import * as _ from 'underscore';

export const shouldCancelStart = (e) => {
  // Cancel sorting if the event target is an `input`, `textarea`, `select`, 'option' or 'svg'
  const disabledElements = [
    'input',
    'textarea',
    'select',
    'option',
    'button',
    'svg',
    'path'
  ];
  if (disabledElements.includes(e.target.tagName.toLowerCase())) {
    return true; // Return true to cancel sorting
  } else {
    return false;
  }
}

const sortableItemStyles = (theme: ThemeType): JssStyles => ({
  root: {
    listStyle: "none",
    fontFamily: theme.typography.fontFamily
  }
})

// React sortable has constructors that don't work like normal constructors
//eslint-disable-next-line babel/new-cap
const SortableItem = withStyles(sortableItemStyles, {name: "SortableItem"})(SortableElement(({userId, currentUser, removeItem, classes}) =>
  <li className={classes.root}>
    <Components.SingleUsersItemWrapper documentId={userId} removeItem={removeItem} />
  </li>
))


const sortableListStyles = createStyles((theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    flexWrap: "wrap"
  }
}))
// React sortable has constructors that don't work like normal constructors
//eslint-disable-next-line babel/new-cap
export const SortableList = withStyles(sortableListStyles, {name: "SortableList"})(SortableContainer(({items, currentUser, removeItem, classes}) => {
  return (
    <div className={classes.root}>
      {items.map((userId, index) => (
        <SortableItem key={`item-${index}`} removeItem={removeItem} index={index} userId={userId} currentUser={currentUser}/>
      ))}
    </div>
  );
}));

const usersListEditorStyles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex"
  }
})

class UsersListEditor extends Component<any> {
  onSortEnd = ({oldIndex, newIndex}: {oldIndex: number, newIndex: number}) => {
    const newIds = arrayMove(this.props.value, oldIndex, newIndex);
    this.context.updateCurrentValues({[this.props.path]: newIds});
  };
  addUserId = (userId: string) => {
    const newIds = [...this.props.value, userId];
    this.context.updateCurrentValues({[this.props.path]: newIds});
  }
  removeUserId = (userId: string) => {
    const newIds = _.without(this.props.value, userId);
    this.context.updateCurrentValues({[this.props.path]: newIds});
  }

  render() {
    const { classes, label, currentUser } = this.props

    return (
      <div className={classes.root}>
        <Components.ErrorBoundary>
          <Components.UsersSearchAutoComplete
            clickAction={this.addUserId}
            label={label}
          />
        </Components.ErrorBoundary>
        <SortableList
          axis="xy"
          items={this.props.value}
          onSortEnd={this.onSortEnd}
          currentUser={currentUser}
          removeItem={this.removeUserId}
          shouldCancelStart={shouldCancelStart}
        />
      </div>
    )
  }
};

(UsersListEditor as any).contextTypes = {
  updateCurrentValues: PropTypes.func,
};

const UsersListEditorComponent = registerComponent("UsersListEditor", UsersListEditor, {
  styles: usersListEditorStyles,
  hocs: [withUser]
});

declare global {
  interface ComponentTypes {
    UsersListEditor: typeof UsersListEditorComponent
  }
}
