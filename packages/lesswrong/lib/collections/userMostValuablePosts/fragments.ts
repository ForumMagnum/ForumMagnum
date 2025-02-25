import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment UserMostValuablePostInfo on UserMostValuablePost {
    _id
    userId
    postId
    deleted
  }
`);
