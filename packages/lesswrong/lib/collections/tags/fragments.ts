import { registerFragment } from '../../vulcan-lib';

registerFragment(`
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
`);

registerFragment(`
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
`);

registerFragment(`
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
`);

registerFragment(`
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
`);

registerFragment(`
  fragment TagCreationHistoryFragment on Tag {
    ...TagFragment
    user {
      ...UsersMinimumInfo
    }
    description {
      html
    }
  }
`);

registerFragment(`
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
`);

registerFragment(`
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
      wordCount
    }
    canVoteOnRels
    isArbitalImport
  }
`);

registerFragment(`
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
      wordCount
    }
    canVoteOnRels
  }
`);

registerFragment(`
  fragment TagSubforumFragment on Tag {
    ...TagPreviewFragment
    subforumModeratorIds
    tableOfContents
    subforumWelcomeText {
      _id
      html
    }
  }
`);

// TODO: would prefer to fetch subtags in fewer places
registerFragment(`
  fragment TagSubtagFragment on Tag {
    _id
    subforumModeratorIds
    subTags {
      ...TagPreviewFragment
    }
  }
`);

registerFragment(`
  fragment TagSubforumSidebarFragment on Tag {
    ...TagBasicInfo
  }
`);

registerFragment(`
  fragment TagDetailedPreviewFragment on Tag {
    ...TagDetailsFragment
    description {
      _id
      htmlHighlight
      wordCount
    }
  }
`);

registerFragment(`
  fragment TagWithFlagsFragment on Tag {
    ...TagFragment
    tagFlagsIds
    tagFlags {
      ...TagFlagFragment
    }
  }
`);

registerFragment(`
  fragment TagWithFlagsAndRevisionFragment on Tag {
    ...TagRevisionFragment
    tagFlagsIds
    tagFlags {
      ...TagFlagFragment
    }
  }
`);

// This matches custom graphql type in arbitalLinkedPagesField.ts that's a resolver field on Tags and MultiDocuments
registerFragment(`
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
`);

registerFragment(`
  fragment TagPageArbitalContentFragment on Tag {
    lenses {
      ...MultiDocumentWithContributors
    }
    arbitalLinkedPages {
      ...ArbitalLinkedPagesFragment
    }
  }
`);

registerFragment(`
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
`);

registerFragment(`
  fragment TagPageWithArbitalContentFragment on Tag {
    ...TagPageFragment
    ...TagPageArbitalContentFragment
  }  
`);

registerFragment(`
  fragment AllTagsPageFragment on Tag {
    ...TagWithFlagsFragment
    tableOfContents
  }
`);

registerFragment(`
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
`);

registerFragment(`
  fragment TagPageRevisionWithArbitalContentFragment on Tag {
    ...TagPageWithRevisionFragment
    ...TagPageArbitalContentFragment
  }  
`);

registerFragment(`
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
`);

registerFragment(`
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
`);

registerFragment(`
  fragment TagRecentDiscussion on Tag {
    ...TagFragment
    lastVisitedAt
    recentComments(tagCommentsLimit: $tagCommentsLimit, maxAgeHours: $maxAgeHours, af: $af) {
      ...CommentsList
    }
  }
`);

registerFragment(`
  fragment SunshineTagFragment on Tag {
    ...TagFragment
    user {
      ...UsersMinimumInfo
    }
  }
`);

registerFragment(`
  fragment UserOnboardingTag on Tag {
    _id
    name
    slug
    bannerImageId
    squareImageId
  }
`);

registerFragment(`
  fragment TagName on Tag {
    _id
    name
    slug
  }
`);

registerFragment(`
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
`);

registerFragment(`
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
    isArbitalImport
    coreTagId
    maxScore
    usersWhoLiked {
      _id
      displayName
    }
  }
`);

registerFragment(`
  fragment TagPageWithArbitalContentAndLensRevisionFragment on Tag {
    ...TagPageFragment
    arbitalLinkedPages {
      ...ArbitalLinkedPagesFragment
    }
    lenses(lensSlug: $lensSlug, version: $version) {
      ...MultiDocumentWithContributorsRevision
    }
  }
`);

registerFragment(`
  fragment WithVoteTag on Tag {
    ...TagBasicInfo
  }
`);
