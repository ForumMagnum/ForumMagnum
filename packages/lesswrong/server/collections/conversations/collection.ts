import { userCanDo } from '@/lib/vulcan-users/permissions';
import schema from '@/lib/collections/conversations/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

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
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Conversations', { moderator: 1, messageCount: 1, latestActivity: -1, participantIds: 1 })
    indexSet.addIndex('Conversations', { participantIds: 1, messageCount: 1, latestActivity: -1 })
    indexSet.addIndex('Conversations', { participantIds: 1, title: 1 })
    return indexSet;
  },
  resolvers: getDefaultResolvers('Conversations'),
  mutations: getDefaultMutations('Conversations', options)
});

Conversations.checkAccess = async (user: DbUser|null, document: DbConversation, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return document.participantIds?.includes(user._id) ? userCanDo(user, 'conversations.view.own') : userCanDo(user, `conversations.view.all`)
};

export default Conversations;
