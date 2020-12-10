import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import React from 'react';


const SingleUsersItemWrapper = ({documentId, removeItem}: {
  documentId: string,
  removeItem: (id:string)=>void,
}) => {
  const { document, loading } = useSingle({
    documentId,
    collectionName: "Users",
    fragmentName: 'UsersProfile',
  });
  if (document && !loading) {
    return <span className="search-results-users-item users-item">
      <Components.SingleUsersItem document={document} removeItem={removeItem}/>
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
