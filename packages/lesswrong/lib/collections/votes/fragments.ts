import { registerFragment } from '../../vulcan-lib';


registerFragment(`
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
`);

registerFragment(`
  fragment TagVotingActivity on Vote {
    ...TagRelVotes
    tagRel {
      ...TagRelFragment
    }
  }
`)

registerFragment(`
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
`);

registerFragment(`
  fragment UserVotesWithDocument on Vote {
    ...UserVotes
    comment {
      ...CommentsListWithParentMetadata
    }
    post {
      ...PostsListWithVotes
    }
  }
`);

registerFragment(`
  fragment userReactions on Vote {
    _id
    userId
    voteType
    extendedVoteType
    power
    cancelled
    documentId
    votedAt
    isUnvote
    collectionName
  }
`);

registerFragment(`
  fragment Reacts on Vote {
    _id
    documentId
    userId
    createdAt
    reactType
  }
`);
