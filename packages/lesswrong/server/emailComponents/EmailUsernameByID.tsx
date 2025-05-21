import React from 'react';
import { useSingle } from '../../lib/crud/withSingle';
import { EmailUsername } from './EmailUsername';

export const EmailUsernameByID = ({userID}: {
  userID: string
}) => {
  const { document, loading } = useSingle({
    documentId: userID,
    collectionName: "Users",
    fragmentName: 'UsersMinimumInfo',
  });
  return <EmailUsername user={document}/>
}

