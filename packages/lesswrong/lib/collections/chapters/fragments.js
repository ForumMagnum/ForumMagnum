import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment ChaptersFragment on Chapter {
    _id
    createdAt
    title
    subtitle
    description
    htmlDescription
    number
    sequenceId
    postIds
    posts {
      ...LWPostsList
    }
  }
`);
