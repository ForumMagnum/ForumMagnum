import { Components, registerComponent } from 'meteor/vulcan:core';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';
import Users from 'meteor/vulcan:users';


const SingleUsersItemWrapper = ({clickAction, documentId, removeItem, ...props}) => {
  const { document, loading } = useSingle({
    documentId,
    collection: Users,
    fragmentName: 'UsersProfile',
  });
  if (document && !loading) {
    return <span className="search-results-users-item users-item">
      <Components.SingleUsersItem document={document} clickAction={clickAction} removeItem={removeItem}/>
    </span>
  } else {
    return <Components.Loading />
  }
};

const SingleUsersItemWrapperComponent = registerComponent('SingleUsersItemWrapper', SingleUsersItemWrapper);

declare global {
  interface ComponentTypes {
    SingleUsersItemWrapper: typeof SingleUsersItemWrapperComponent
  }
}
