import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment messageListFragment on Message {
    _id
    user {
      ...UsersMinimumInfo
      profileImageId
    }
    contents {
      html
      plaintextMainText
    }
    createdAt
    conversationId
  }
`);
