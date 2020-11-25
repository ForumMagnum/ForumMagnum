import { registerComponent, Components } from '../../lib/vulcan-lib';
import React from 'react';

const UsersName = ({user, documentId, nofollow=false, simple=false, tooltipPlacement = "left"}: {
  user?: UsersMinimumInfo|null|undefined,
  documentId?: string,
  nofollow?: boolean,
  simple?: boolean,
  tooltipPlacement?: "left" | "top" | "right" | "bottom"
}) => {
  if (documentId) {
    return <Components.UsersNameWrapper documentId={documentId} nofollow={nofollow} simple={simple} />
  } else if (user) {
    return <Components.UsersNameDisplay user={user} nofollow={nofollow} simple={simple} tooltipPlacement={tooltipPlacement}/>
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
