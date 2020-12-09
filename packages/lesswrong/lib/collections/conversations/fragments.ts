import { registerFragment } from '../../vulcan-lib/fragments';

registerFragment(`
  fragment conversationsListFragment on Conversation {
    _id
    title
    createdAt
    latestActivity
    participantIds
    participants {
      ...UsersMinimumInfo
    }
    archivedByIds
    messageCount
  }
`);

registerFragment(`
  fragment newConversationFragment on Conversation {
    _id
    title
    participantIds
  }
`);
