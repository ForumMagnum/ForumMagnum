import { userCanDo, userOwns } from '../../vulcan-users/permissions';
import schema from './schema';
import { createCollection } from '../../vulcan-lib/collections';
import Conversations from '../conversations/collection'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';
import { addUniversalFields } from "../../collectionUtils";
import { getDefaultResolvers } from "../../vulcan-core/default_resolvers";
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

addUniversalFields({
  collection: Messages,
  createdAtOptions: {canRead: ['members']},
});

Messages.checkAccess = async (user: DbUser|null, document: DbMessage, context: ResolverContext|null): Promise<boolean> => {
  if (!user || !document) return false;
  return (await Conversations.findOne({_id: document.conversationId}))?.participantIds?.includes(user._id) ?
    userCanDo(user, 'messages.view.own') : userCanDo(user, `messages.view.all`)
};

export default Messages;
