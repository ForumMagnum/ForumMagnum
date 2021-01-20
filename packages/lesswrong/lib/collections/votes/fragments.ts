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
