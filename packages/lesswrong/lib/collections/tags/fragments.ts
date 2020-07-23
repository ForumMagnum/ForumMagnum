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
  }
`);

registerFragment(`
  fragment TagFragment on Tag {
    ...TagBasicInfo
    description {
      html
      htmlHighlight
      plaintextDescription
    }
  }
`);

registerFragment(`
  fragment TagRevisionFragment on Tag {
    ...TagBasicInfo
    description(version: $version) {
      html
      htmlHighlight
      plaintextDescription
    }
  }
`);

registerFragment(`
  fragment TagPreviewFragment on Tag {
    ...TagBasicInfo
    description {
      htmlHighlight
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
