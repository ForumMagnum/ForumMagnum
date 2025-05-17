import { gql } from "@/lib/generated/gql-codegen/gql";

export const TagBasicInfo = gql(`
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
`)

export const TagDetailsFragment = gql(`
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
`)

export const TagFragment = gql(`
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
`)

export const TagHistoryFragment = gql(`
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
`)

export const TagCreationHistoryFragment = gql(`
  fragment TagCreationHistoryFragment on Tag {
    ...TagFragment
    user {
      ...UsersMinimumInfo
    }
    description {
      html
    }
  }
`)

export const TagRevisionFragment = gql(`
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
`)

export const TagPreviewFragment = gql(`
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
`)

export const TagSectionPreviewFragment = gql(`
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
`)

export const TagSubforumFragment = gql(`
  fragment TagSubforumFragment on Tag {
    ...TagPreviewFragment
    subforumModeratorIds
    tableOfContents
    subforumWelcomeText {
      _id
      html
    }
  }
`)

// TODO: would prefer to fetch subtags in fewer places
export const TagSubtagFragment = gql(`
  fragment TagSubtagFragment on Tag {
    _id
    subforumModeratorIds
    subTags {
      ...TagPreviewFragment
    }
  }
`)

export const TagSubforumSidebarFragment = gql(`
  fragment TagSubforumSidebarFragment on Tag {
    ...TagBasicInfo
  }
`)

export const TagDetailedPreviewFragment = gql(`
  fragment TagDetailedPreviewFragment on Tag {
    ...TagDetailsFragment
    description {
      _id
      htmlHighlight
    }
  }
`)

export const TagWithFlagsFragment = gql(`
  fragment TagWithFlagsFragment on Tag {
    ...TagFragment
    tagFlagsIds
    tagFlags {
      ...TagFlagFragment
    }
  }
`)

export const TagWithFlagsAndRevisionFragment = gql(`
  fragment TagWithFlagsAndRevisionFragment on Tag {
    ...TagRevisionFragment
    tagFlagsIds
    tagFlags {
      ...TagFlagFragment
    }
  }
`)

// This matches custom graphql type in arbitalLinkedPagesField.ts that's a resolver field on Tags and MultiDocuments
export const ArbitalLinkedPagesFragment = gql(`
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
`)

export const TagPageArbitalContentFragment = gql(`
  fragment TagPageArbitalContentFragment on Tag {
    lenses {
      ...MultiDocumentWithContributors
    }
    arbitalLinkedPages {
      ...ArbitalLinkedPagesFragment
    }
  }
`)

export const TagPageFragment = gql(`
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
`)

export const TagPageWithArbitalContentFragment = gql(`
  fragment TagPageWithArbitalContentFragment on Tag {
    ...TagPageFragment
    ...TagPageArbitalContentFragment
  }
`)

export const AllTagsPageFragment = gql(`
  fragment AllTagsPageFragment on Tag {
    ...TagWithFlagsFragment
    tableOfContents
  }
`)

export const TagPageWithRevisionFragment = gql(`
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
`)

export const TagPageRevisionWithArbitalContentFragment = gql(`
  fragment TagPageRevisionWithArbitalContentFragment on Tag {
    ...TagPageWithRevisionFragment
    ...TagPageArbitalContentFragment
  }
`)

export const TagFullContributorsList = gql(`
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
`)

export const TagEditFragment = gql(`
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
`)

export const TagRecentDiscussion = gql(`
  fragment TagRecentDiscussion on Tag {
    ...TagFragment
    lastVisitedAt
    recentComments(tagCommentsLimit: $tagCommentsLimit, maxAgeHours: $maxAgeHours, af: $af) {
      ...CommentsList
    }
  }
`)

export const SunshineTagFragment = gql(`
  fragment SunshineTagFragment on Tag {
    ...TagFragment
    user {
      ...UsersMinimumInfo
    }
  }
`)

export const UserOnboardingTag = gql(`
  fragment UserOnboardingTag on Tag {
    _id
    name
    slug
    bannerImageId
    squareImageId
  }
`)

export const TagName = gql(`
  fragment TagName on Tag {
    _id
    name
    slug
  }
`)

export const ExplorePageTagFragment = gql(`
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
`)

export const ConceptItemFragment = gql(`
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
`)

export const TagPageWithArbitalContentAndLensRevisionFragment = gql(`
  fragment TagPageWithArbitalContentAndLensRevisionFragment on Tag {
    ...TagPageFragment
    arbitalLinkedPages {
      ...ArbitalLinkedPagesFragment
    }
    lenses(lensSlug: $lensSlug, version: $version) {
      ...MultiDocumentWithContributorsRevision
    }
  }
`)

export const WithVoteTag = gql(`
  fragment WithVoteTag on Tag {
    ...TagBasicInfo
  }
`)
