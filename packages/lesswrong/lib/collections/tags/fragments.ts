export const TagBasicInfo = `
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

export const TagDetailsFragment = `
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

export const TagFragment = `
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

export const TagHistoryFragment = `
  fragment TagHistoryFragment on Tag {
    ...TagFragment
    tableOfContents
    user {
      ...UsersMinimumInfo
    }
    lensesIncludingDeleted {
      ...MultiDocumentContentDisplay
    }
  }
`

export const TagCreationHistoryFragment = `
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

export const TagRevisionFragment = `
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

export const TagPreviewFragment = `
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

export const TagSectionPreviewFragment = `
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

export const TagSubforumFragment = `
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
export const TagSubtagFragment = `
  fragment TagSubtagFragment on Tag {
    _id
    subforumModeratorIds
    subTags {
      ...TagPreviewFragment
    }
  }
`

export const TagSubforumSidebarFragment = `
  fragment TagSubforumSidebarFragment on Tag {
    ...TagBasicInfo
  }
`

export const TagDetailedPreviewFragment = `
  fragment TagDetailedPreviewFragment on Tag {
    ...TagDetailsFragment
    description {
      _id
      htmlHighlight
    }
  }
`

export const TagWithFlagsFragment = `
  fragment TagWithFlagsFragment on Tag {
    ...TagFragment
    tagFlagsIds
    tagFlags {
      ...TagFlagFragment
    }
  }
`

export const TagWithFlagsAndRevisionFragment = `
  fragment TagWithFlagsAndRevisionFragment on Tag {
    ...TagRevisionFragment
    tagFlagsIds
    tagFlags {
      ...TagFlagFragment
    }
  }
`

// This matches custom graphql type in arbitalLinkedPagesField.ts that's a resolver field on Tags and MultiDocuments
export const ArbitalLinkedPagesFragment = `
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

export const TagPageArbitalContentFragment = `
  fragment TagPageArbitalContentFragment on Tag {
    lenses {
      ...MultiDocumentWithContributors
    }
    arbitalLinkedPages {
      ...ArbitalLinkedPagesFragment
    }
  }
`

export const TagPageFragment = `
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
  }
`

export const TagPageWithArbitalContentFragment = `
  fragment TagPageWithArbitalContentFragment on Tag {
    ...TagPageFragment
    ...TagPageArbitalContentFragment
  }  
`

export const AllTagsPageFragment = `
  fragment AllTagsPageFragment on Tag {
    ...TagWithFlagsFragment
    tableOfContents
  }
`

export const TagPageWithRevisionFragment = `
  fragment TagPageWithRevisionFragment on Tag {
    ...TagWithFlagsAndRevisionFragment
    tableOfContents(version: $version)
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
  }
`

export const TagPageRevisionWithArbitalContentFragment = `
  fragment TagPageRevisionWithArbitalContentFragment on Tag {
    ...TagPageWithRevisionFragment
    ...TagPageArbitalContentFragment
  }  
`

export const TagFullContributorsList = `
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

export const TagEditFragment = `
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

export const TagRecentDiscussion = `
  fragment TagRecentDiscussion on Tag {
    ...TagFragment
    lastVisitedAt
    recentComments(tagCommentsLimit: $tagCommentsLimit, maxAgeHours: $maxAgeHours, af: $af) {
      ...CommentsList
    }
  }
`

export const SunshineTagFragment = `
  fragment SunshineTagFragment on Tag {
    ...TagFragment
    user {
      ...UsersMinimumInfo
    }
  }
`

export const UserOnboardingTag = `
  fragment UserOnboardingTag on Tag {
    _id
    name
    slug
    bannerImageId
    squareImageId
  }
`

export const TagName = `
  fragment TagName on Tag {
    _id
    name
    slug
  }
`

export const ExplorePageTagFragment = `
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

export const ConceptItemFragment = `
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

export const TagPageWithArbitalContentAndLensRevisionFragment = `
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

export const WithVoteTag = `
  fragment WithVoteTag on Tag {
    ...TagBasicInfo
  }
`
