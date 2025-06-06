import { gql } from "@/lib/crud/wrapGql";

export const TagRelVotes = gql(`
  fragment TagRelVotes on Vote {
    _id
    userId
    voteType
    power
    documentId
    votedAt
    isUnvote
    tagRel {
      ...WithVoteTagRel
    }
  }
`)

export const TagVotingActivity = gql(`
  fragment TagVotingActivity on Vote {
    ...TagRelVotes
    tagRel {
      ...TagRelFragment
    }
  }
`)

export const UserVotes = gql(`
  fragment UserVotes on Vote {
    _id
    userId
    voteType
    power
    cancelled
    documentId
    votedAt
    isUnvote
    collectionName
  }
`)

export const UserVotesWithDocument = gql(`
  fragment UserVotesWithDocument on Vote {
    ...UserVotes
    comment {
      ...CommentsListWithParentMetadata
    }
    post {
      ...PostsListWithVotes
    }
  }
`)
