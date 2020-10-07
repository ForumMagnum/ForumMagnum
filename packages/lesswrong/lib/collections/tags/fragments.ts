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
  fragment TagRevisionFragment on Tag {
    ...TagBasicInfo
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
  fragment SunshineTagFragment on Tag {
    ...TagFragment
    user {
      ...UsersMinimumInfo
    }
  }
`);
