import React from 'react';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';

export const EmailUsername = ({user, className}: {
  user: UsersMinimumInfo|DbUser|null|undefined
  className?: string,
}) => {
  if (!user) {
    return <span className={className}>[deleted]</span>;
  }
  return (
    <a href={userGetProfileUrl(user, true)} className={className}>
      {user.displayName}
    </a>
  );
}

