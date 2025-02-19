import { registerFragment } from "../../vulcan-lib/fragments";

registerFragment(`
  fragment ConversationsMinimumInfo on Conversation {
    _id
    createdAt
    latestActivity
    title
    participantIds
    archivedByIds
    messageCount
    moderator
  }
`);

registerFragment(`
  fragment ConversationsList on Conversation {
    ...ConversationsMinimumInfo
    participants {
      ...UsersMinimumInfo
    }
    latestMessage {
      ...messageListFragment
    }
  }
`);

registerFragment(`
  fragment ConversationsListWithReadStatus on Conversation {
    ...ConversationsList
    hasUnreadMessages
  }
`);
