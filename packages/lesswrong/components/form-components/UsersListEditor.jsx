import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';
import { registerComponent, Components, withCurrentUser } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';


const sortableItemStyles = theme => ({
  sortableItem: {
    listStyle: "none",
    fontFamily: theme.typography.fontFamily
  }
})

// React sortable has constructors that don't work like normal constructors
//eslint-disable-next-line babel/new-cap
const SortableItem = withStyles(sortableItemStyles)(SortableElement(({userId, currentUser, removeItem, classes}) =>
  <li className={classes.sortableItem}>
    <Components.SingleUsersItemWrapper documentId={userId} currentUser={currentUser} removeItem={removeItem} />
  </li>
))


const sortableListStyles = theme => ({
  sortableList: {
    display: "flex",
    flexWrap: "wrap"
  }
})
// React sortable has constructors that don't work like normal constructors
//eslint-disable-next-line babel/new-cap
const SortableList = withStyles(sortableListStyles)(SortableContainer(({items, currentUser, removeItem, classes}) => {
  return (
    <div className={classes.sortableList}>
      {items.map((userId, index) => (
        <SortableItem key={`item-${index}`} removeItem={removeItem} index={index} userId={userId} currentUser={currentUser}/>
      ))}
    </div>
  );
}));

const usersListEditorStyles = theme => ({
  root: {
    marginLeft: theme.spacing.unit*2
  },
  search: {
    display: "flex"
  }
})

class UsersListEditor extends Component {
  constructor(props, context) {
    super(props, context);
    const fieldName = props.name;
    let userIds = [];
    if (props.document[fieldName]) {
      userIds = JSON.parse(JSON.stringify(props.document[fieldName]));
    }
    this.state = {
      userIds: userIds,
    }
    const addValues = this.context.updateCurrentValues;
    addValues({[fieldName]: userIds});
  }
  onSortEnd = ({oldIndex, newIndex}) => {
    const fieldName = this.props.name;
    const addValues = this.context.updateCurrentValues;
    const newIds = arrayMove(this.state.userIds, oldIndex, newIndex);
    this.setState({
      userIds: newIds,
    });
    addValues({[fieldName]: newIds});
  };
  addUserId = (userId) => {
    const newIds = [...this.state.userIds, userId];
    this.setState({
      userIds: newIds,
    })
    const fieldName = this.props.name;
    const addValues = this.context.updateCurrentValues;
    addValues({[fieldName]: newIds});
  }
  removeUserId = (userId) => {
    const newIds = _.without(this.state.userIds, userId);
    this.setState({
      userIds: newIds,
    })
    const fieldName = this.props.name;
    const addValues = this.context.updateCurrentValues;
    addValues({[fieldName]: newIds});
  }
  shouldCancelStart = (e) => {
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
    }
  }

  render() {
    const { classes, label, currentUser } = this.props

    return (
      <div className={classes.root}>
        <div className={classes.search}>
          <Components.UsersSearchAutoComplete
            clickAction={this.addUserId}
            label={label}
          />
          <SortableList
            axis="xy"
            items={this.state.userIds}
            onSortEnd={this.onSortEnd}
            currentUser={currentUser}
            removeItem={this.removeUserId}
            shouldCancelStart={this.shouldCancelStart}
          />
        </div>
      </div>
    )
  }
}

//

UsersListEditor.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

registerComponent("UsersListEditor", UsersListEditor, withCurrentUser, withStyles(usersListEditorStyles));
