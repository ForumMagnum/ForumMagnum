export const messageListFragment = `
  fragment messageListFragment on Message {
    _id
    user {
      ...UsersMinimumInfo
      profileImageId
    }
    contents {
      html
      plaintextMainText
    }
    createdAt
    conversationId
  }
`
