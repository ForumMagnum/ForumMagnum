import { registerFragment } from '../../vulcan-lib';

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
      ...PostsListWithVotes
    }
  }
`);

registerFragment(`
  fragment ChaptersEdit on Chapter {
    ...ChaptersFragment
    contents {
      ...RevisionEdit
    }
  }
`);
