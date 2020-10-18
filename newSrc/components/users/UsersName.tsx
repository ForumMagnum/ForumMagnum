import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';

const UsersName = ({user, documentId, nofollow=false, simple=false}: {
  user?: UsersMinimumInfo|null|undefined,
  documentId?: string,
  nofollow?: boolean,
  simple?: boolean,
}) => {
  if (documentId) {
    return <Components.UsersNameWrapper documentId={documentId} nofollow={nofollow} simple={simple} />
  } else if (user) {
    return <Components.UsersNameDisplay user={user} nofollow={nofollow} simple={simple} />
  } else {
    return <Components.UserNameDeleted />
  }
}

const UsersNameComponent = registerComponent('UsersName', UsersName);

declare global {
  interface ComponentTypes {
    UsersName: typeof UsersNameComponent
  }
}
