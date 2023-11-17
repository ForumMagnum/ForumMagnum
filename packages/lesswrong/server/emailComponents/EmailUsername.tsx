import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';

const EmailUsername = ({user}: {
  user: UsersMinimumInfo|DbUser|null|undefined
}) => {
  if (!user) return <span>[deleted]</span>
  return <a href={userGetProfileUrl(user, true)}>{user.displayName}</a>
}

const EmailUsernameComponent = registerComponent("EmailUsername", EmailUsername);

declare global {
  interface ComponentTypes {
    EmailUsername: typeof EmailUsernameComponent
  }
}
