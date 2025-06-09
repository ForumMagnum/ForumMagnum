import { gql } from "@/lib/generated/gql-codegen";
export const ModeratorClientIDInfo = gql(`
  fragment ModeratorClientIDInfo on ClientId {
    _id
    clientId
    createdAt
    firstSeenReferrer
    firstSeenLandingPage
    users {
      ...UsersMinimumInfo
    }
  }
`);
