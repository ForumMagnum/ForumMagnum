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
    isSubforum
  }
`);

registerFragment(`
  fragment TagWithTocFragment on Tag {
    ...TagFragment
    descriptionHtmlWithToc
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

// TODO-JM: add comment explaining subforumPostId add here to avoid two round trips
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
    isSubforum
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
    isSubforum
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
    isSubforum
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
    ...TagBasicInfo
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
    isSubforum
  }
`);
