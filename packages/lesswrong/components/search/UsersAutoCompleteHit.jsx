import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment';
import RemoveIcon from 'material-ui/svg-icons/navigation/close';
import classNames from 'classnames'


const UsersAutoCompleteHit = ({document, removeItem }) => {
  if (document) {
    return <span className="users-search-hit-body">
      <span className="users-search-hit-name">
        {document.displayName}
      </span>
      <span className="users-search-hit-meta">
        <span className="users-search-hit-karma">{document.karma} points </span>
        <span className="users-search-hit-created-date"> {moment(new Date(document.createdAt)).fromNow()}</span>
      </span>
    </span>
  } else {
    return <Components.Loading />
  }
};
registerComponent('UsersAutoCompleteHit', UsersAutoCompleteHit);
