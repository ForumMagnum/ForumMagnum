import { userCanDo, userOwns } from '../../vulcan-users/permissions';
import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import Conversations from '../conversations/collection'
import { makeEditable } from '../../editor/make_editable'
import { addUniversalFields, getDefaultResolvers } from '../../collectionUtils'
import { getDefaultMutations, MutationOptions } from '../../vulcan-core/default_mutations';

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
  resolvers: getDefaultResolvers('Messages'),
  mutations: getDefaultMutations('Messages', options),
  // Don't log things related to Messages to LWEvents, to keep LWEvents relatively
  // free of confidential stuff that admins shouldn't look at.
  logChanges: false,
});

makeEditable({
  collection: Messages,
  options: {
    // Determines whether to use the comment editor configuration (e.g. Toolbars)
    commentEditor: true,
    // Determines whether to use the comment editor styles (e.g. Fonts)
    commentStyles: true,
    permissions: {
      canRead: ['members'],
      canCreate: ['members'],
      canUpdate: userOwns,
    },
    order: 2,
  }
})

addUniversalFields({
  collection: Messages,
  createdAtOptions: {canRead: ['members']},
});

export default Messages;
