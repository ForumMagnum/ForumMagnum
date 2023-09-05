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
