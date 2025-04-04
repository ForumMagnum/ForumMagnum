import { frag } from "@/lib/fragments/fragmentWrapper"

export const TagRelVotes = () => frag`
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
`

export const TagVotingActivity = () => frag`
  fragment TagVotingActivity on Vote {
    ...TagRelVotes
    tagRel {
      ...TagRelFragment
    }
  }
`

export const UserVotes = () => frag`
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
`

export const UserVotesWithDocument = () => frag`
  fragment UserVotesWithDocument on Vote {
    ...UserVotes
    comment {
      ...CommentsListWithParentMetadata
    }
    post {
      ...PostsListWithVotes
    }
  }
`
