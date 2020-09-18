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
    tagFlagsIds
    lesswrongWikiImportSlug
    lesswrongWikiImportRevision
  }
`);

registerFragment(`
  fragment TagFragment on Tag {
    ...TagBasicInfo
    description {
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
      htmlHighlight
      version
    }
  }
`);

registerFragment(`
  fragment TagWithFlagsFragment on Tag {
    ...TagPreviewFragment
    tagFlags {
      ...TagFlagFragment
    } 
  }
`);

registerFragment(`
  fragment TagEditFragment on Tag {
    ...TagBasicInfo
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
