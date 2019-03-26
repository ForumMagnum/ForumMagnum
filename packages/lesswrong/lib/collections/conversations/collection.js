import Users from 'meteor/vulcan:users';
import schema from './schema.js';
import { createCollection, getDefaultResolvers, getDefaultMutations } from 'meteor/vulcan:core';
import { addUniversalFields } from '../../collectionUtils'

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

export const Conversations = createCollection({
  collectionName: 'Conversations',
  typeName: 'Conversation',
  schema,
  resolvers: getDefaultResolvers('Conversations'),
  mutations: getDefaultMutations('Conversations', options)
});

// Conversations,
addUniversalFields({collection: Conversations})

export default Conversations;