import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment TagRelFragment on TagRel {
    _id
    baseScore
    afBaseScore
    userId
    tagId
    tag {
      _id
      name
      slug
      description {
        htmlHighlight
      }
    }
    postId
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
    postId
    tag {
      _id
      name
      slug
      description {
        htmlHighlight
      }
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
    tagId
    tag {
      _id
      name
      slug
    }
    postId
    currentUserVotes {
      _id
      voteType
      power
    }
    baseScore
    afBaseScore
    score
    voteCount
  }
`);
