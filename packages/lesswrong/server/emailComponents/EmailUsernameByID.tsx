import React from 'react';
import { EmailUsername } from './EmailUsername';
import { gql } from "@/lib/generated/gql-codegen";
import { useEmailQuery } from '../vulcan-lib/query';
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
  const { data } = await useEmailQuery(UsersMinimumInfoQuery, {
    variables: { documentId: userID },
    emailContext
  });
  const document = data?.user?.result;
  return <EmailUsername user={document}/>
}

