import { Components, withDocument } from 'meteor/vulcan:core';
import React from 'react';
import Users from 'meteor/vulcan:users';
import defineComponent from '../../lib/defineComponent';


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
  totalResolver: false,
};

export default defineComponent({
  name: 'SingleUsersItemWrapper',
  component: SingleUsersItemWrapper,
  hocs: [ [withDocument, options] ]
});
