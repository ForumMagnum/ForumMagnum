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
  fragment TagRelHistoryFragment on TagRel {
    ...TagRelBasicInfo
    createdAt
    user {
      ...UsersMinimumInfo
    }
    post {
      ...PostsBase
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


// This fragment has to be fully dereferences, because the context of vote fragments doesn't allow for spreading other fragments
registerFragment(`
  fragment WithVoteTagRel on TagRel {
    __typename
    _id
    score
    baseScore
    afBaseScore
    voteCount
    userId
    tagId
    postId
    post {
      _id
      slug
      title
    }
    tag {
      _id
      name
      slug
      core
      postCount
      deleted
      adminOnly
      description {
        htmlHighlight
      }
    }
    currentUserVotes {
      _id
      voteType
      power
    }
  }
`);
