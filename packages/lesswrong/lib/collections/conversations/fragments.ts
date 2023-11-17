import { registerFragment } from "../../vulcan-lib/fragments";

/**
 * @deprecated Use ConversationsMinimumInfo
 * TODO Remove after 2023-11-03
 * */
registerFragment(`
  fragment newConversationFragment on Conversation {
    _id
    title
    participantIds
  }
`);

/**
 * @deprecated Use ConversationsList
 * TODO Remove after 2023-11-03
 * */
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
    latestMessage {
      ...messageListFragment
    }
    archivedByIds
    messageCount
    moderator
  }
`);

/**
 * @deprecated Use ConversationsMinimumInfo
 * TODO Remove after 2023-11-03
 * */
registerFragment(`
  fragment conversationIdFragment on Conversation {
    _id
  }
`);

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
