import Users from '../users/collection';
import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
  newCheck: (user, document) => {
    if (!user || !document) return false;
    return document.participantIds.includes(user._id) ? Users.canDo(user, 'conversations.new.own')
     : Users.canDo(user, `conversations.new.all`)
  },

  editCheck: (user, document) => {
    if (!user || !document) return false;
    return document.participantIds.includes(user._id) ? Users.canDo(user, 'conversations.edit.own')
    : Users.canDo(user, `conversations.edit.all`)
  },

  removeCheck: (user, document) => {
    if (!user || !document) return false;
    return document.participantIds.includes(user._id) ? Users.canDo(user, 'conversations.remove.own')
    : Users.canDo(user, `conversations.remove.all`)
  },
}

interface ExtendedConversationsCollection extends ConversationsCollection {
  // Functions in lib/collections/conversations/helpers.ts
  getTitle: (conversation: conversationsListFragment, currentUser: UsersCurrent) => string
  getPageUrl: (conversation: HasIdType, isAbsolute?: boolean) => string
  
  // Functions in lib/helpers.ts
  getLink: (conversatoin: HasIdType) => string
}

export const Conversations: ExtendedConversationsCollection = createCollection({
  collectionName: 'Conversations',
  typeName: 'Conversation',
  schema,
  resolvers: getDefaultResolvers('Conversations'),
  mutations: getDefaultMutations('Conversations', options)
});

// Conversations,
addUniversalFields({collection: Conversations})

export default Conversations;
