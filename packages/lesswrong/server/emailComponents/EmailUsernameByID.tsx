import React from 'react';
import { EmailUsername } from './EmailUsername';
import { gql } from "@/lib/generated/gql-codegen";
import { emailUseQuery } from '../vulcan-lib/query';
import { EmailContextType } from './emailContext';

const UsersMinimumInfoQuery = gql(`
  query EmailUsernameByID($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UsersMinimumInfo
      }
    }
  }
`);

export const EmailUsernameByID = async ({userID, fallbackName, emailContext}: {
  userID: string
  /** Name to display when the user ID doesn't correspond to a real user (e.g. agent comments) */
  fallbackName?: string
  emailContext: EmailContextType
}) => {
  const { data } = await emailUseQuery(UsersMinimumInfoQuery, {
    variables: { documentId: userID },
    emailContext
  });
  const document = data?.user?.result;
  if (!document && fallbackName) {
    return <span>{fallbackName}</span>
  }
  return <EmailUsername user={document}/>
}

