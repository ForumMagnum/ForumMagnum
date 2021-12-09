import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment TagRelBasicInfo on TagRel {
    _id
    score
    baseScore
    baseScoresRecord
    afBaseScore
    voteCount
    voteCountsRecord
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
    currentUserVote
    currentUserVotesRecord
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
      ...PostsList
    }
  }
`);

registerFragment(`
  fragment TagRelCreationFragment on TagRel {
    ...TagRelBasicInfo
    tag {
      ...TagPreviewFragment
    }
    post {
      ...PostsList
      tagRelevance
      tagRel(tagId: $tagId) {
        ...WithVoteTagRel
      }
    }
    currentUserVote
    currentUserVotesRecord
  }
`);

registerFragment(`
  fragment TagRelMinimumFragment on TagRel {
    ...TagRelBasicInfo
    tag {
      ...TagPreviewFragment
    }
    currentUserVote
    currentUserVotesRecord
  }
`);


// This fragment has to be fully dereferences, because the context of vote fragments doesn't allow for spreading other fragments
registerFragment(`
  fragment WithVoteTagRel on TagRel {
    __typename
    _id
    userId
    score
    baseScore
    baseScoresRecord
    afBaseScore
    voteCount
    voteCountsRecord
    currentUserVote
    currentUserVotesRecord
  }
`);
