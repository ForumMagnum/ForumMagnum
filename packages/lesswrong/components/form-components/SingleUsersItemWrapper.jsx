import { Components, registerComponent } from 'meteor/vulcan:core';
import { withSingle } from '../../lib/crud/withSingle';
import React from 'react';
import Users from 'meteor/vulcan:users';


const SingleUsersItemWrapper = ({clickAction, document, loading, removeItem, ...props}) => {
  if (document && !loading) {
    return <span className="search-results-users-item users-item">
      <Components.SingleUsersItem document={document} clickAction={clickAction} removeItem={removeItem}/>
    </span>
  } else {
    return <Components.Loading />
  }
};

const options = {
  collection: Users,
  queryName: "SingleUsersItemQuery",
  fragmentName: 'UsersProfile',
  enableTotal: false,
};

registerComponent('SingleUsersItemWrapper', SingleUsersItemWrapper, [withSingle, options]);
