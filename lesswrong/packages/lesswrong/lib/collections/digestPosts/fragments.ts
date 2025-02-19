import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment DigestPostsMinimumInfo on DigestPost {
    _id
    digestId
    postId
    emailDigestStatus
    onsiteDigestStatus
  }
`);
