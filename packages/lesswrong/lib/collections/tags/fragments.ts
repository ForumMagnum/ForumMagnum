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
    }
    canVoteOnRels
  }
`);

registerFragment(`
  fragment TagHistoryFragment on Tag {
    ...TagBasicInfo
    user {
      ...UsersMinimumInfo
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
      
      user {
        ...UsersMinimumInfo
      }
    }
  }
`);

registerFragment(`
  fragment TagPreviewFragment on Tag {
    ...TagBasicInfo
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

registerFragment(`
  fragment TagPageFragment on Tag {
    ...TagWithFlagsFragment
    tableOfContents
    postsDefaultSortOrder
    subforumIntroPost {
      ...PostsList
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
        numCommits
        voteCount
      }
    }
    canVoteOnRels
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
      ...PostsList
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
        numCommits
        voteCount
      }
    }
    canVoteOnRels
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
    parentTag {
      ...TagBasicInfo
    }
    subforumIntroPostId
    tagFlagsIds
    postsDefaultSortOrder
    
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
