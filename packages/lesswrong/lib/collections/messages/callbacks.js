import { addEditableCallbacks } from '../../../server/editor/make_editable_callbacks.js'
import Messages, { makeEditableOptions } from './collection.js'
import Conversations from '../conversations/collection'
import { addCallback } from 'meteor/vulcan:core'

addEditableCallbacks({collection: Messages, options: makeEditableOptions})

function unArchiveConversations({insertedDocument}) {
  Conversations.update({_id:insertedDocument.conversationId}, {$set: {archivedByIds: []}});
}

addCallback('message.create.async', unArchiveConversations)
