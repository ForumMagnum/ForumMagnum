import { registerFragment } from '../../vulcan-lib';

registerFragment(`
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
`)


registerFragment(`
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
`)

registerFragment(`
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
`)


