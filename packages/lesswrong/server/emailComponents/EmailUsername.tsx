import type { EmailContextType } from './emailContext';
import React from 'react';
import { userGetAbsoluteProfileUrl } from '../../lib/collections/users/helpers';

export const EmailUsername = ({user, emailContext}: {
  user: UsersMinimumInfo|DbUser|null|undefined,
  emailContext: EmailContextType,
}) => {
  if (!user) return <span>[deleted]</span>
  return <a href={userGetAbsoluteProfileUrl(user, emailContext.resolverContext.forumType)}>{user.displayName}</a>
}

