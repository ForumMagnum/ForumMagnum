import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import Users from 'meteor/vulcan:users';

const EmailUsername = ({user}) => {
  return <a href={Users.getProfileUrl(user, true)}>{user.displayName}</a>
}

registerComponent("EmailUsername", EmailUsername);