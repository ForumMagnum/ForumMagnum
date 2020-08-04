import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment VoteMinimumInfo on Vote {
    _id
    voteType
  }
`);


registerFragment(`
  fragment VoteFragment on Vote {
    _id
    voteType
    power
  }
`);

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
      ...TagRelBasicInfo
      tag {
        ...TagBasicInfo
      }
      post {
        ...PostsBase
      }
    }
  }
`)

// note: fragment used by default on the UsersProfile fragment
registerFragment(/* GraphQL */`
  fragment VotedItem on Vote {
    documentId
    power
    votedAt
  }
`);
