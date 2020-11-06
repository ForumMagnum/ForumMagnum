import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment TagBasicInfo on Tag {
    _id
    name
    slug
    oldSlugs
    core
    postCount
    deleted
    adminOnly
    defaultOrder
    suggestedAsFilter
    needsReview
    reviewedByUserId
    descriptionTruncationCount
    wikiGrade
    createdAt
    wikiOnly
    lesswrongWikiImportSlug
    lesswrongWikiImportRevision
  }
`);

registerFragment(`
  fragment TagFragment on Tag {
    ...TagBasicInfo
    isRead
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
    ...TagBasicInfo
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
    description {
      _id
      htmlHighlight
      version
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
  fragment TagEditFragment on Tag {
    ...TagBasicInfo
    tagFlagsIds
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
  }
`);
