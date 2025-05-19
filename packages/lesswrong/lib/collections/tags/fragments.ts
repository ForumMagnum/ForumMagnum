import { frag } from "@/lib/fragments/fragmentWrapper"

export const TagBasicInfo = () => frag`
  fragment TagBasicInfo on Tag {
    _id
    userId
    name
    shortName
    slug
    core
    postCount
    adminOnly
    canEditUserIds
    suggestedAsFilter
    needsReview
    descriptionTruncationCount
    createdAt
    wikiOnly
    deleted
    isSubforum
    noindex
    isArbitalImport
    isPlaceholderPage

    baseScore
    extendedScore
    score
    afBaseScore
    afExtendedScore
    voteCount
    currentUserVote
    currentUserExtendedVote
  }
`

export const TagDetailsFragment = () => frag`
  fragment TagDetailsFragment on Tag {
    ...TagBasicInfo
    subtitle
    oldSlugs
    isRead
    defaultOrder
    reviewedByUserId
    wikiGrade
    subforumModeratorIds
    subforumModerators {
      ...UsersMinimumInfo
    }
    moderationGuidelines {
      _id
      html
    }
    bannerImageId
    squareImageId
    lesswrongWikiImportSlug
    lesswrongWikiImportRevision
    sequence {
      ...SequencesPageFragment
    }
  }
`

export const TagFragment = () => frag`
  fragment TagFragment on Tag {
    ...TagDetailsFragment
    parentTag {
      ...TagBasicInfo
    }
    subTags {
      ...TagBasicInfo
    }
    description {
      _id
      html
      htmlHighlight
      plaintextDescription
      version
      editedAt
    }
    canVoteOnRels
  }
`

export const TagHistoryFragment = () => frag`
  fragment TagHistoryFragment on Tag {
    ...TagFragment
    textLastUpdatedAt
    tableOfContents
    user {
      ...UsersMinimumInfo
    }
    lensesIncludingDeleted {
      ...MultiDocumentContentDisplay
    }
  }
`

export const TagCreationHistoryFragment = () => frag`
  fragment TagCreationHistoryFragment on Tag {
    ...TagFragment
    user {
      ...UsersMinimumInfo
    }
    description {
      html
    }
  }
`

export const TagRevisionFragment = () => frag`
  fragment TagRevisionFragment on Tag {
    ...TagDetailsFragment
    parentTag {
      ...TagBasicInfo
    }
    subTags {
      ...TagBasicInfo
    }
    isRead
    description(version: $version) {
      _id
      version
      html
      htmlHighlight
      plaintextDescription
      editedAt
      
      user {
        ...UsersMinimumInfo
      }
    }
  }
`

export const TagPreviewFragment = () => frag`
  fragment TagPreviewFragment on Tag {
    ...TagBasicInfo
    isRead
    parentTag {
      ...TagBasicInfo
    }
    subTags {
      ...TagBasicInfo
    }
    description {
      _id
      htmlHighlight
    }
    canVoteOnRels
    isArbitalImport
  }
`

export const TagSectionPreviewFragment = () => frag`
  fragment TagSectionPreviewFragment on Tag {
    ...TagBasicInfo
    isRead
    parentTag {
      ...TagBasicInfo
    }
    subTags {
      ...TagBasicInfo
    }
    description {
      _id
      htmlHighlightStartingAtHash(hash: $hash)
    }
    canVoteOnRels
  }
`

export const TagSubforumFragment = () => frag`
  fragment TagSubforumFragment on Tag {
    ...TagPreviewFragment
    subforumModeratorIds
    tableOfContents
    subforumWelcomeText {
      _id
      html
    }
  }
`

// TODO: would prefer to fetch subtags in fewer places
export const TagSubtagFragment = () => frag`
  fragment TagSubtagFragment on Tag {
    _id
    subforumModeratorIds
    subTags {
      ...TagPreviewFragment
    }
  }
`

export const TagSubforumSidebarFragment = () => frag`
  fragment TagSubforumSidebarFragment on Tag {
    ...TagBasicInfo
  }
`

export const TagDetailedPreviewFragment = () => frag`
  fragment TagDetailedPreviewFragment on Tag {
    ...TagDetailsFragment
    description {
      _id
      htmlHighlight
    }
  }
`

export const TagWithFlagsFragment = () => frag`
  fragment TagWithFlagsFragment on Tag {
    ...TagFragment
    tagFlagsIds
    tagFlags {
      ...TagFlagFragment
    }
  }
`

export const TagWithFlagsAndRevisionFragment = () => frag`
  fragment TagWithFlagsAndRevisionFragment on Tag {
    ...TagRevisionFragment
    tagFlagsIds
    tagFlags {
      ...TagFlagFragment
    }
  }
`

// This matches custom graphql type in arbitalLinkedPagesField.ts that's a resolver field on Tags and MultiDocuments
export const ArbitalLinkedPagesFragment = () => frag`
  fragment ArbitalLinkedPagesFragment on ArbitalLinkedPages {
    faster {
      _id
      name
      slug
    }
    slower {
      _id
      name
      slug
    }
    moreTechnical {
      _id
      name
      slug
    }
    lessTechnical {
      _id
      name
      slug
    }
    requirements {
      _id
      name
      slug
    }
    teaches {
      _id
      name
      slug
    }
    parents {
      _id
      name
      slug
    }
    children {
      _id
      name
      slug
    }
  }
`

export const TagPageArbitalContentFragment = () => frag`
  fragment TagPageArbitalContentFragment on Tag {
    lenses {
      ...MultiDocumentWithContributors
    }
    arbitalLinkedPages {
      ...ArbitalLinkedPagesFragment
    }
  }
`

export const TagPageFragment = () => frag`
  fragment TagPageFragment on Tag {
    ...TagWithFlagsFragment
    tableOfContents
    postsDefaultSortOrder
    subforumIntroPost {
      ...PostsListWithVotes
    }
    subforumWelcomeText {
      _id
      html
    }
    contributors(limit: $contributorsLimit) {
      totalCount
      contributors {
        user {
          ...UsersMinimumInfo
        }
        contributionScore
        currentAttributionCharCount
        numCommits
        voteCount
      }
    }
    canVoteOnRels
    forceAllowType3Audio
    textLastUpdatedAt
  }
`

export const TagPageWithArbitalContentFragment = () => frag`
  fragment TagPageWithArbitalContentFragment on Tag {
    ...TagPageFragment
    ...TagPageArbitalContentFragment
  }  
`

export const AllTagsPageFragment = () => frag`
  fragment AllTagsPageFragment on Tag {
    ...TagWithFlagsFragment
    tableOfContents
  }
`

export const TagPageWithRevisionFragment = () => frag`
  fragment TagPageWithRevisionFragment on Tag {
    ...TagWithFlagsAndRevisionFragment
    tableOfContents(version: $version)
    textLastUpdatedAt
    postsDefaultSortOrder
    subforumIntroPost {
      ...PostsListWithVotes
    }
    subforumWelcomeText {
      _id
      html
    }
    contributors(limit: $contributorsLimit, version: $version) {
      totalCount
      contributors {
        user {
          ...UsersMinimumInfo
        }
        contributionScore
        currentAttributionCharCount
        numCommits
        voteCount
      }
    }
    canVoteOnRels
    forceAllowType3Audio
  }
`

export const TagPageRevisionWithArbitalContentFragment = () => frag`
  fragment TagPageRevisionWithArbitalContentFragment on Tag {
    ...TagPageWithRevisionFragment
    ...TagPageArbitalContentFragment
  }  
`

export const TagFullContributorsList = () => frag`
  fragment TagFullContributorsList on Tag {
    contributors {
      totalCount
      contributors {
        user {
          ...UsersMinimumInfo
        }
        contributionScore
        currentAttributionCharCount
        numCommits
        voteCount
      }
    }
  }
`

export const TagEditFragment = () => frag`
  fragment TagEditFragment on Tag {
    ...TagDetailsFragment
    isPostType
    parentTagId
    parentTag {
      ...TagBasicInfo
    }
    subforumIntroPostId
    tagFlagsIds
    postsDefaultSortOrder
    introSequenceId
    canVoteOnRels
    
    autoTagModel
    autoTagPrompt
    
    description {
      ...RevisionEdit
    }
    subforumWelcomeText {
      ...RevisionEdit
    }
    moderationGuidelines {
      ...RevisionEdit
    }
  }
`

export const TagRecentDiscussion = () => frag`
  fragment TagRecentDiscussion on Tag {
    ...TagFragment
    lastVisitedAt
    recentComments(tagCommentsLimit: $tagCommentsLimit, maxAgeHours: $maxAgeHours, af: $af) {
      ...CommentsList
    }
  }
`

export const SunshineTagFragment = () => frag`
  fragment SunshineTagFragment on Tag {
    ...TagFragment
    user {
      ...UsersMinimumInfo
    }
  }
`

export const UserOnboardingTag = () => frag`
  fragment UserOnboardingTag on Tag {
    _id
    name
    slug
    bannerImageId
    squareImageId
  }
`

export const TagName = () => frag`
  fragment TagName on Tag {
    _id
    name
    slug
  }
`

export const ExplorePageTagFragment = () => frag`
  fragment ExplorePageTagFragment on Tag {
    ...TagFragment
    contributors(limit: $contributorsLimit) {
      totalCount
      contributors {
        user {
          ...UsersMinimumInfo
        }
        contributionScore
        currentAttributionCharCount
        numCommits
        voteCount
      }
    }
    legacyData
  }
`

export const ConceptItemFragment = () => frag`
  fragment ConceptItemFragment on Tag {
    _id
    core
    name
    slug
    oldSlugs
    postCount
    baseScore
    description {
      _id
      wordCount
    }
    wikiOnly
    isArbitalImport
    coreTagId
    maxScore
    usersWhoLiked {
      _id
      displayName
    }
  }
`

export const TagPageWithArbitalContentAndLensRevisionFragment = () => frag`
  fragment TagPageWithArbitalContentAndLensRevisionFragment on Tag {
    ...TagPageFragment
    arbitalLinkedPages {
      ...ArbitalLinkedPagesFragment
    }
    lenses(lensSlug: $lensSlug, version: $version) {
      ...MultiDocumentWithContributorsRevision
    }
  }
`

export const WithVoteTag = () => frag`
  fragment WithVoteTag on Tag {
    ...TagBasicInfo
  }
`
