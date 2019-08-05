import React from 'react';
import { registerComponent } from 'vulcan:core';
import Users from 'vulcan:users';

const EmailUsername = ({user}) => {
  return <a href={Users.getProfileUrl(user, true)}>{user.displayName}</a>
}

registerComponent("EmailUsername", EmailUsername);