import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment';
import RemoveIcon from 'material-ui/svg-icons/navigation/close';
import classNames from 'classnames'


const UsersAutoCompleteHit = ({document, removeItem }) => {
  if (document) {
    return <span className="users-item-body">
      <span className="users-item-name">
        {document.displayName}
      </span>
      <span className="users-item-meta">
        <span className="users-item-karma">{document.karma} points </span>
        <span className="users-item-created-date"> {moment(new Date(document.createdAt)).fromNow()}</span>
      </span>
    </span>
  } else {
    return <Components.Loading />
  }
};
registerComponent('UsersAutoCompleteHit', UsersAutoCompleteHit);
