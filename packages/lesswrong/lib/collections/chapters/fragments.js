import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment ChaptersFragment on Chapter {
    _id
    createdAt
    title
    subtitle
    contents {
      ...RevisionDisplay
    }
    number
    sequenceId
    postIds
    posts {
      ...PostsList
    }
  }
`);
