import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment TagBasicInfo on Tag {
    _id
    userId
    name
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
  }
`);

registerFragment(`
  fragment TagDetailsFragment on Tag {
    ...TagBasicInfo
    oldSlugs
    isRead
    defaultOrder
    reviewedByUserId
    wikiGrade
    isSubforum
    subforumModeratorIds
    subforumModerators {
      ...UsersMinimumInfo
    }
    bannerImageId
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
      name
      slug
    }
    subTags {
      name
      slug
    }
    
    description {
      _id
      html
      htmlHighlight
      plaintextDescription
      version
    }
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
      name
      slug
    }
    subTags {
      name
      slug
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
      name
      slug
    }
    subTags {
      name
      slug
    }
    description {
      _id
      htmlHighlight
    }
  }
`);

registerFragment(`
  fragment TagSubforumFragment on Tag {
    ...TagPreviewFragment
    isSubforum
    tableOfContents
    subforumWelcomeText {
      _id
      html
    }
  }
`);

registerFragment(`
  fragment TagSubforumSidebarFragment on Tag {
    ...TagBasicInfo
    subforumUnreadMessagesCount
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
    parentTag {
      _id
      name
      slug
    }
    tagFlagsIds
    postsDefaultSortOrder
    description {
      ...RevisionEdit
    }
    subforumWelcomeText {
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
  fragment TagRecentSubforumComments on Tag {
    ...TagFragment
    lastVisitedAt
    recentComments(tagCommentsLimit: $tagCommentsLimit, maxAgeHours: $maxAgeHours, af: $af, tagCommentType: "SUBFORUM") {
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
