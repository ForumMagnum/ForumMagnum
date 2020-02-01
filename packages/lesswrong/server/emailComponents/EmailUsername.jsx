import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import Users from '../../lib/collections/users/collection';

const EmailUsername = ({user}) => {
  return <a href={Users.getProfileUrl(user, true)}>{user.displayName}</a>
}

registerComponent("EmailUsername", EmailUsername);
