import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment TagBasicInfo on Tag {
    _id
    name
    slug
    core
    postCount
    adminOnly
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
    
    description {
      _id
      html
      htmlHighlight
      plaintextDescription
      version
    }
    subforumShortformPostId
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
    description {
      _id
      htmlHighlight
    }
    subforumShortformPostId
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
    subforumShortformPostId
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
    subforumShortformPostId
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
    subforumShortformPostId
  }
`);
