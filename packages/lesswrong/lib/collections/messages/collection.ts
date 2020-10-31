import Users from '../users/collection';
import schema from './schema';
import { createCollection } from '../../vulcan-lib';
import Conversations from '../conversations/collection'
import { makeEditable } from '../../editor/make_editable'
import { addUniversalFields, getDefaultResolvers, getDefaultMutations } from '../../collectionUtils'

const options = {
  newCheck: (user: DbUser|null, document: DbMessage|null) => {
    if (!user || !document) return false;
    const conversation = Conversations.findOne({_id: document.conversationId})
    return conversation && conversation.participantIds.includes(user._id) ?
      Users.canDo(user, 'messages.new.own') : Users.canDo(user, `messages.new.all`)
  },

  editCheck: (user: DbUser|null, document: DbMessage|null) => {
    if (!user || !document) return false;
    const conversation = Conversations.findOne({_id: document.conversationId})
    return conversation && conversation.participantIds.includes(user._id) ?
    Users.canDo(user, 'messages.edit.own') : Users.canDo(user, `messages.edit.all`)
  },

  removeCheck: (user: DbUser|null, document: DbMessage|null) => {
    if (!user || !document) return false;
    const conversation = Conversations.findOne({_id: document.conversationId})
    return conversation && conversation.participantIds.includes(user._id) ?
    Users.canDo(user, 'messages.remove.own') : Users.canDo(user, `messages.remove.all`)
  },
}

export const Messages: MessagesCollection = createCollection({
  collectionName: 'Messages',
  typeName: 'Message',
  schema,
  resolvers: getDefaultResolvers('Messages'),
  mutations: getDefaultMutations('Messages', options),
});

export const makeEditableOptions = {
  // Determines whether to use the comment editor configuration (e.g. Toolbars)
  commentEditor: true,
  // Determines whether to use the comment editor styles (e.g. Fonts)
  commentStyles: true,
  permissions: {
    viewableBy: ['members'],
    insertableBy: ['members'],
    editableBy: Users.owns,
  },
  order: 2,
}

makeEditable({
  collection: Messages,
  options: makeEditableOptions
})

addUniversalFields({collection: Messages})

export default Messages;
