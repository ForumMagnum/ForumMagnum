import React from 'react';
import { EmailUsername } from './EmailUsername';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const UsersMinimumInfoQuery = gql(`
  query EmailUsernameByID($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UsersMinimumInfo
      }
    }
  }
`);

export const EmailUsernameByID = ({userID}: {
  userID: string
}) => {
  const { loading, data } = useQuery(UsersMinimumInfoQuery, {
    variables: { documentId: userID },
  });
  const document = data?.user?.result;
  return <EmailUsername user={document}/>
}

