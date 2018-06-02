import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {SortableContainer, SortableElement, arrayMove} from 'react-sortable-hoc';
import { registerComponent, Components, withCurrentUser } from 'meteor/vulcan:core';

// React sortable has constructors that don't work like normal constructors
//eslint-disable-next-line babel/new-cap
const SortableItem = SortableElement(({userId, currentUser, removeItem}) =>
  <li className="users-list-editor-item">
    <Components.SingleUsersItemWrapper documentId={userId} currentUser={currentUser} removeItem={removeItem} />
  </li>
);

// React sortable has constructors that don't work like normal constructors
//eslint-disable-next-line babel/new-cap
const SortableList = SortableContainer(({items, currentUser, removeItem}) => {
  return (
    <div>
      {items.map((userId, index) => (
        <SortableItem key={`item-${index}`} removeItem={removeItem} index={index} userId={userId} currentUser={currentUser}/>
      ))}
    </div>
  );
});

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
    return (
      <div className="users-list-editor">
        {this.props.label && <h5>{this.props.label}</h5>}
        <SortableList
          axis="xy"
          items={this.state.userIds}
          onSortEnd={this.onSortEnd}
          currentUser={this.props.currentUser}
          removeItem={this.removeUserId}
          shouldCancelStart={this.shouldCancelStart}
        />
        <Components.UsersSearchAutoComplete
          clickAction={this.addUserId}
        />
      </div>
    )
  }
}

//

UsersListEditor.contextTypes = {
  updateCurrentValues: PropTypes.func,
  addToSuccessForm: PropTypes.func,
};

registerComponent("UsersListEditor", UsersListEditor, withCurrentUser);
