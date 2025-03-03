export const ModeratorClientIDInfo = `
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
`;
