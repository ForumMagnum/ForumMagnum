import { frag } from "@/lib/fragments/fragmentWrapper"

export const TagRelBasicInfo = () => frag`
  fragment TagRelBasicInfo on TagRel {
    _id
    score
    baseScore
    extendedScore
    afBaseScore
    voteCount
    tagId
    postId
    autoApplied
  }
`


export const TagRelFragment = () => frag`
  fragment TagRelFragment on TagRel {
    ...TagRelBasicInfo
    tag {
      ...TagPreviewFragment
    }
    post {
      ...PostsList
    }
    currentUserVote
    currentUserExtendedVote
    currentUserCanVote
  }
`

export const TagRelHistoryFragment = () => frag`
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
`

export const TagRelCreationFragment = () => frag`
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
    currentUserExtendedVote
  }
`

export const TagRelMinimumFragment = () => frag`
  fragment TagRelMinimumFragment on TagRel {
    ...TagRelBasicInfo
    tag {
      ...TagPreviewFragment
    }
    currentUserVote
    currentUserExtendedVote
    currentUserCanVote
  }
`


// This fragment has to be fully dereferences, because the context of vote fragments doesn't allow for spreading other fragments
export const WithVoteTagRel = () => frag`
  fragment WithVoteTagRel on TagRel {
    __typename
    _id
    score
    baseScore
    extendedScore
    afBaseScore
    voteCount
    currentUserVote
    currentUserExtendedVote
  }
`
