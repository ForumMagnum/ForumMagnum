import { userCanDo } from '../../vulcan-users/permissions';
import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';

export const userCanStartConversations = (user: DbUser|UsersCurrent) => {
  if (user.deleted) return false
  if (user.conversationsDisabled) return false;
  return true
}

const options: MutationOptions<DbConversation> = {
  newCheck: (user: DbUser|null, document: DbConversation|null) => {
    if (!user || !document) return false;
    if (!userCanStartConversations(user)) return false
    return document.participantIds.includes(user._id) ? userCanDo(user, 'conversations.new.own')
     : userCanDo(user, `conversations.new.all`)
  },

  editCheck: (user: DbUser|null, document: DbConversation|null) => {
    if (!user || !document) return false;
    return document.participantIds.includes(user._id) ? userCanDo(user, 'conversations.edit.own')
    : userCanDo(user, `conversations.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbConversation|null) => {
    if (!user || !document) return false;
    return document.participantIds.includes(user._id) ? userCanDo(user, 'conversations.remove.own')
    : userCanDo(user, `conversations.remove.all`)
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
addUniversalFields({
  collection: Conversations,
  createdAtOptions: {canRead: ['members']},
})

export default Conversations;
