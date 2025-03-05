export const TagRelVotes = `
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

export const TagVotingActivity = `
  fragment TagVotingActivity on Vote {
    ...TagRelVotes
    tagRel {
      ...TagRelFragment
    }
  }
`

export const UserVotes = `
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

export const UserVotesWithDocument = `
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
