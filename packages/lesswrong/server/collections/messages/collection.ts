import { userCanDo } from '@/lib/vulcan-users/permissions';
import schema from '@/lib/collections/messages/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/server/resolvers/defaultResolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const options: MutationOptions<DbMessage> = {
  newCheck: async (user: DbUser|null, document: DbMessage|null, context: ResolverContext) => {
    const { Conversations } = context;
    if (!user || !document) return false;
    const conversation = await Conversations.findOne({_id: document.conversationId})
    return conversation && conversation.participantIds.includes(user._id) ?
      userCanDo(user, 'messages.new.own') : userCanDo(user, `messages.new.all`)
  },

  editCheck: async (user: DbUser|null, document: DbMessage|null, context: ResolverContext) => {
    const { Conversations } = context;
    if (!user || !document) return false;
    const conversation = await Conversations.findOne({_id: document.conversationId})
    return conversation && conversation.participantIds.includes(user._id) ?
    userCanDo(user, 'messages.edit.own') : userCanDo(user, `messages.edit.all`)
  },

  removeCheck: async (user: DbUser|null, document: DbMessage|null, context: ResolverContext) => {
    const { Conversations } = context;
    if (!user || !document) return false;
    const conversation = await Conversations.findOne({_id: document.conversationId})
    return conversation && conversation.participantIds.includes(user._id) ?
    userCanDo(user, 'messages.remove.own') : userCanDo(user, `messages.remove.all`)
  },
}

export const Messages: MessagesCollection = createCollection({
  collectionName: 'Messages',
  typeName: 'Message',
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Messages', { conversationId:1, createdAt:1 });
    return indexSet;
  },
  resolvers: getDefaultResolvers('Messages'),
  mutations: getDefaultMutations('Messages', options),
  // Don't log things related to Messages to LWEvents, to keep LWEvents relatively
  // free of confidential stuff that admins shouldn't look at.
  logChanges: false,
});

export default Messages;
