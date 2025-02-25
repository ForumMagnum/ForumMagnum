import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment DigestPostsMinimumInfo on DigestPost {
    _id
    digestId
    postId
    emailDigestStatus
    onsiteDigestStatus
  }
`);
