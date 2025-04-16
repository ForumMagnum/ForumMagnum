import React from 'react';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';

export const EmailUsername = ({user}: {
  user: UsersMinimumInfo|DbUser|null|undefined
}) => {
  if (!user) return <span>[deleted]</span>
  return <a href={userGetProfileUrl(user, true)}>{user.displayName}</a>
}

