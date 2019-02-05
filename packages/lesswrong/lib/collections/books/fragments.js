import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment BookPageFragment on Book {
    _id
    createdAt
    title
    number
    subtitle
    contents {
      ...RevisionDisplay
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

registerFragment(`
  fragment BookEdit on Book {
    ...BookPageFragment
    contents {
      ...RevisionEdit
    }
  }
`);
