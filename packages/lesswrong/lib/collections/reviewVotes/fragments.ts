import { frag } from "@/lib/fragments/fragmentWrapper"

export const reviewVoteFragment = () => frag`
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


export const reviewVoteWithUserAndPost = () => frag`
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

export const reviewAdminDashboard = () => frag`
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


