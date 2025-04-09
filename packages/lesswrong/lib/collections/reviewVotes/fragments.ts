import { gql } from "@/lib/generated/gql-codegen/gql";

export const reviewVoteFragment = () => gql(`
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


export const reviewVoteWithUserAndPost = () => gql(`
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

export const reviewAdminDashboard = () => gql(`
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


