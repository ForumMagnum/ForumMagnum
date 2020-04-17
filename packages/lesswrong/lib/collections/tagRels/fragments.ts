import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment TagRelBasicInfo on TagRel {
    _id
    score
    baseScore
    afBaseScore
    voteCount
    userId
    tagId
    postId
  }
`);


registerFragment(`
  fragment TagRelFragment on TagRel {
    ...TagRelBasicInfo
    tag {
      ...TagPreviewFragment
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
    ...TagRelBasicInfo
    tag {
      ...TagPreviewFragment
    }
    currentUserVotes {
      ...VoteFragment
    }
  }
`);

registerFragment(`
  fragment WithVoteTagRel on TagRel {
    __typename
    ...TagRelFragment
  }
`);
