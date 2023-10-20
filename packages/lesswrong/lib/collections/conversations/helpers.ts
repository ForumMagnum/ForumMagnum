import { getSiteUrl } from '../../vulcan-lib/utils';
import * as _ from 'underscore';

export const conversationGetTitle = (conversation: ConversationsList, currentUser: UsersCurrent): string => {
  if (!!conversation.title) {
    return conversation.title
  } else if (conversation.participants) {
    const usernames = _.pluck(conversation.participants, 'displayName')
    const otherParticipantNames = _.filter(usernames, (u)=>u != currentUser.displayName)
    return `Conversation with ${otherParticipantNames.join(' and ')}`
  } else {
    throw Error(`Can't create title for conversation ${conversation._id} for user ${currentUser._id} – missing participant info`)
  }
}

// TODO merge with previous
export const conversationGetTitle2 = (conversation: ConversationsList, currentUser: UsersCurrent): string => {
  if (!!conversation.title) {
    return conversation.title
  }

  const otherParticipants = conversation.participants.filter((u)=> u._id !== currentUser._id)
  const firstParticipant = otherParticipants[0] ?? conversation.participants[0];

  if (firstParticipant) {
    return `${firstParticipant.displayName}${
      otherParticipants.length > 1 ? ` + ${otherParticipants.length - 1} more` : ""
    }`;
  } else {
    return "Conversation";
  }
}

export const conversationGetPageUrl = (conversation: HasIdType, isAbsolute=false): string => {
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';

  return `${prefix}/inbox/${conversation._id}`;
}
