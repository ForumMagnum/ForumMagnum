import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment UserMostValuablePostInfo on UserMostValuablePost {
    _id
    userId
    postId
    deleted
  }
`);
