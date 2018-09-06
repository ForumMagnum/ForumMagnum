import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import moment from 'moment';

const UsersAutoCompleteHit = ({document, removeItem }) => {
  if (document) {
    return <div>
      <Components.MetaInfo>
        {document.displayName}
      </Components.MetaInfo>
      <Components.MetaInfo>
        {document.karma} points
      </Components.MetaInfo>
      <Components.MetaInfo>
        {moment(new Date(document.createdAt)).fromNow()}
      </Components.MetaInfo>
    </div>
  } else {
    return <Components.Loading />
  }
};
registerComponent('UsersAutoCompleteHit', UsersAutoCompleteHit);
