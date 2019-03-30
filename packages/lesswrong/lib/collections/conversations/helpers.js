import Conversations from "./collection.js";
import { Utils } from 'meteor/vulcan:core';

Conversations.getTitle = (conversation, currentUser) => {
  if (!!conversation.title) {
    return conversation.title
  } else if (conversation.participants) {
    const usernames = _.pluck(conversation.participants, 'displayName')
    const otherParticipantNames = _.filter(usernames, (u)=>u != currentUser.displayName)
    return otherParticipantNames.join(', ')
  } else {
    throw Error(`Can't create title for conversation ${conversation._id} for user ${currentUser._id} – missing participant info`)
  }
}

Conversations.getPageUrl = (conversation, isAbsolute=false) => {
  const prefix = isAbsolute ? Utils.getSiteUrl().slice(0,-1) : '';
  
  return `${prefix}/inbox?select=${conversation._id}`;
}
