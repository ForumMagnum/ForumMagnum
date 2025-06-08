import { gql } from "@/lib/crud/wrapGql";
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
