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

export const EmailUsernameByID = async ({userID, emailContext}: {
  userID: string
  emailContext: EmailContextType
}) => {
  const { data } = await emailUseQuery(UsersMinimumInfoQuery, {
    variables: { documentId: userID },
    emailContext
  });
  const document = data?.user?.result;
  return <EmailUsername user={document}/>
}

