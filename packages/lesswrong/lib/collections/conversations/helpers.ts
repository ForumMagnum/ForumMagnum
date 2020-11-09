import { getSiteUrl } from '../../vulcan-lib/utils';
import * as _ from 'underscore';

export const conversationGetTitle = (conversation: conversationsListFragment, currentUser: UsersCurrent): string => {
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

export const conversationGetPageUrl = (conversation: HasIdType, isAbsolute=false): string => {
  const prefix = isAbsolute ? getSiteUrl().slice(0,-1) : '';

  return `${prefix}/inbox/${conversation._id}`;
}
