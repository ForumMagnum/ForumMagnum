import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment TagRelFragment on TagRel {
    _id
    baseScore
    afBaseScore
    voteCount
    userId
    tagId
    tag {
      ...TagPreviewFragment
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
      ...TagPreviewFragment
    }
    currentUserVotes {
      ...VoteFragment
    }
  }
`);

registerFragment(`
  fragment TagRelDocumentInfo on TagRel {
    _id
    ...WithVoteTagRel
    post {
      ...PostsBase
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
