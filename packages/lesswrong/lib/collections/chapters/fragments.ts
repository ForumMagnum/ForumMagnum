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
      ...PostsList
    }
  }
`);

registerFragment(`
  fragment ChaptersMinimumFragment on Chapter {
    posts {
      ...PostsIsRead
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
