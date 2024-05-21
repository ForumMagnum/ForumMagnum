import { getSiteUrl } from '../../vulcan-lib/utils';
import * as _ from 'underscore';

/**
 * Get the title of a conversation, formatted like e.g. "Conversation with Alice and Bob and Charlie and Dave"
 */
export const conversationGetTitle = (conversation: ConversationsList, currentUser: UsersCurrent): string => {
  if (!!conversation.title) {
    return conversation.title
  } else if (conversation.participants) {
    const usernames = _.pluck(conversation.participants, 'displayName')
    const otherParticipantNames = _.filter(usernames, (u)=>u !== currentUser.displayName)
    return `Conversation with ${otherParticipantNames.join(' and ')}`
  } else {
    throw Error(`Can't create title for conversation ${conversation._id} for user ${currentUser._id} – missing participant info`)
  }
}

/**
 * Get the title of a conversation, formatted like e.g. "Bob, Charlie + 1 more"
 */
export const conversationGetFriendlyTitle = (conversation: ConversationsList, currentUser: UsersCurrent): string => {
  if (!!conversation.title) {
    return conversation.title
  }

  const otherParticipants = conversation.participants.filter((u)=> u._id !== currentUser._id)
  const participantNames = otherParticipants.map(participant => participant.displayName);

  if (participantNames.length > 0) {
    let title;
    if (participantNames.length === 2) {
      title = participantNames.join(' and ');
    } else {
      title = participantNames.slice(0, 2).join(', ');
      if (participantNames.length > 2) {
        title += ` + ${participantNames.length - 2} more`;
      }
    }
    return title;
  } else {
    return "Conversation";
  }
}

export const conversationGetPageUrl = (conversation: HasIdType, isAbsolute=false): string => {
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';

  return `${prefix}/inbox/${conversation._id}`;
}
