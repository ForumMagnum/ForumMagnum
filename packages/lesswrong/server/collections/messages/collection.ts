import { userCanDo, userOwns } from '@/lib/vulcan-users/permissions';
import schema from '@/lib/collections/messages/schema';
import { createCollection } from '@/lib/vulcan-lib/collections';
import Conversations from '@/server/collections/conversations/collection'
import { getDefaultMutations, type MutationOptions } from '@/server/resolvers/defaultMutations';
import { getDefaultResolvers } from "@/lib/vulcan-core/default_resolvers";
import { DatabaseIndexSet } from '@/lib/utils/databaseIndexSet';

const options: MutationOptions<DbMessage> = {
  newCheck: async (user: DbUser|null, document: DbMessage|null) => {
    if (!user || !document) return false;
    const conversation = await Conversations.findOne({_id: document.conversationId})
    return conversation && conversation.participantIds.includes(user._id) ?
      userCanDo(user, 'messages.new.own') : userCanDo(user, `messages.new.all`)
  },

  editCheck: async (user: DbUser|null, document: DbMessage|null) => {
    if (!user || !document) return false;
    const conversation = await Conversations.findOne({_id: document.conversationId})
    return conversation && conversation.participantIds.includes(user._id) ?
    userCanDo(user, 'messages.edit.own') : userCanDo(user, `messages.edit.all`)
  },

  removeCheck: async (user: DbUser|null, document: DbMessage|null) => {
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

Messages.checkAccess = async (user: DbUser|null, document: DbMessage, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return (await Conversations.findOne({_id: document.conversationId}))?.participantIds?.includes(user._id) ?
    userCanDo(user, 'messages.view.own') : userCanDo(user, `messages.view.all`)
};

export default Messages;
