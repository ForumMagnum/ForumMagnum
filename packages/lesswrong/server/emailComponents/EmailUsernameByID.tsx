import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';

const EmailUsernameByID = ({userID}: {
  userID: string
}) => {
  const { document, loading } = useSingle({
    documentId: userID,
    collectionName: "Users",
    fragmentName: 'UsersMinimumInfo',
  });
  return <Components.EmailUsername user={document}/>
}

const EmailUsernameByIDComponent = registerComponent("EmailUsernameByID", EmailUsernameByID);

declare global {
  interface ComponentTypes {
    EmailUsernameByID: typeof EmailUsernameByIDComponent
  }
}
