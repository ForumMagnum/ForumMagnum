export const reviewVoteFragment = `
  fragment reviewVoteFragment on ReviewVote {
    _id
    createdAt
    userId
    postId
    qualitativeScore
    quadraticScore
    comment
    year
    dummy
    reactions
  }
`


export const reviewVoteWithUserAndPost = `
  fragment reviewVoteWithUserAndPost on ReviewVote {
    ...reviewVoteFragment
    user {
      ...UsersMinimumInfo
      email
      emails
    }
    post {
      ...PostsMinimumInfo
    }
  }
`

export const reviewAdminDashboard = `
  fragment reviewAdminDashboard on ReviewVote {
    _id
    createdAt
    userId
    user {
      _id
      displayName
      karma
    }
  }
`


