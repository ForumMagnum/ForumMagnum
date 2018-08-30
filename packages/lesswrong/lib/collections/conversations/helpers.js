import Conversations from "./collection.js";

Conversations.getTitle = (conversation, currentUser) => {
  if (!!conversation.title) {
    return conversation.title
  } else {
    const usernames = _.pluck(conversation.participants, 'displayName')
    const otherParticipantNames = _.filter(usernames, (u)=>u != currentUser.displayName)
    return otherParticipantNames.join(', ')
  }
}
