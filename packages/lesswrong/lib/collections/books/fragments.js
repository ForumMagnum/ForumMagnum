import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment BookPageFragment on Book {
    _id
    createdAt
    title
    number
    subtitle
    description {
      html
    }
    sequenceIds
    sequences {
      ...SequencesPageFragment
    }
    postIds
    posts {
      ...PostsList
    }
    collectionId
  }
`);
