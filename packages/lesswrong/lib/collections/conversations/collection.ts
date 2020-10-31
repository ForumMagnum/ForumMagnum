import Users from '../users/collection';
import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
  newCheck: (user: DbUser|null, document: DbConversation|null) => {
    if (!user || !document) return false;
    return document.participantIds.includes(user._id) ? Users.canDo(user, 'conversations.new.own')
     : Users.canDo(user, `conversations.new.all`)
  },

  editCheck: (user: DbUser|null, document: DbConversation|null) => {
    if (!user || !document) return false;
    return document.participantIds.includes(user._id) ? Users.canDo(user, 'conversations.edit.own')
    : Users.canDo(user, `conversations.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbConversation|null) => {
    if (!user || !document) return false;
    return document.participantIds.includes(user._id) ? Users.canDo(user, 'conversations.remove.own')
    : Users.canDo(user, `conversations.remove.all`)
  },
}

export const Conversations: ConversationsCollection = createCollection({
  collectionName: 'Conversations',
  typeName: 'Conversation',
  schema,
  resolvers: getDefaultResolvers('Conversations'),
  mutations: getDefaultMutations('Conversations', options)
});

// Conversations,
addUniversalFields({collection: Conversations})

export default Conversations;
