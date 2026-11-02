import { gql } from "@/lib/generated/gql-codegen";

export const PingbackFragment = gql(`
  fragment PingbackFragment on Pingback {
    _id
    sourcePostId
    targetPostId
    excerpt
    score
    baseScore
    extendedScore
    afBaseScore
    voteCount
    currentUserVote
    currentUserExtendedVote
    sourcePost {
      ...PostsMinimumInfo
      postedAt
      isEvent
      groupId
      user {
        ...UsersMinimumInfo
      }
    }
  }
`)

// This fragment has to be fully dereferenced, because the context of vote fragments doesn't allow for spreading other fragments
export const WithVotePingback = gql(`
  fragment WithVotePingback on Pingback {
    __typename
    _id
    score
    baseScore
    extendedScore
    afBaseScore
    voteCount
    currentUserVote
    currentUserExtendedVote
  }
`)
