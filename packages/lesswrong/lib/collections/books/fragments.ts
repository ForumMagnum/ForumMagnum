import { registerFragment } from '../../vulcan-lib';

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
      ...SequencesPageWithChaptersFragment
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
