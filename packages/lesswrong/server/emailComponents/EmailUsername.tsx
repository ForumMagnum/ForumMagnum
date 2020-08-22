import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Users from '../../lib/collections/users/collection';

const EmailUsername = ({user}: {
  user: UsersMinimumInfo|DbUser
}) => {
  return <a href={Users.getProfileUrl(user, true)}>{user.displayName}</a>
}

const EmailUsernameComponent = registerComponent("EmailUsername", EmailUsername);

declare global {
  interface ComponentTypes {
    EmailUsername: typeof EmailUsernameComponent
  }
}
