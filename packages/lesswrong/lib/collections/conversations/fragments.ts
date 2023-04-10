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
    moderator
  }
`);

registerFragment(`
  fragment newConversationFragment on Conversation {
    _id
    title
    participantIds
  }
`);

registerFragment(`
  fragment conversationIdFragment on Conversation {
    _id
  }
`);
