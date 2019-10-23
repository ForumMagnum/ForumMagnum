import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment TagRelFragment on TagRel {
    _id
    baseScore
    afBaseScore
    userId
    tag {
      _id
      name
    }
    post {
      ...PostsList
    }
    currentUserVotes {
      ...VoteFragment
    }
  }
`);

registerFragment(`
  fragment TagRelMinimumFragment on TagRel {
    _id
    baseScore
    afBaseScore
    userId
    tag {
      _id
      name
    }
    currentUserVotes {
      ...VoteFragment
    }
  }
`);

registerFragment(`
  fragment WithVoteTagRel on TagRel {
    __typename
    _id
    userId
    currentUserVotes {
      ...VoteFragment
    }
    baseScore
    afBaseScore
    score
    voteCount
  }
`);
