import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment ChaptersFragment on Chapter {
    _id
    createdAt
    title
    subtitle
    description {
      html
    }
    number
    sequenceId
    postIds
    posts {
      ...PostsList
    }
  }
`);
