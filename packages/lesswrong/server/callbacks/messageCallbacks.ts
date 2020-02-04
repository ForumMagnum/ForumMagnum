import { addEditableCallbacks } from '../editor/make_editable_callbacks'
import Messages, { makeEditableOptions } from '../../lib/collections/messages/collection'
import Conversations from '../../lib/collections/conversations/collection'
import { addCallback } from 'meteor/vulcan:core'

addEditableCallbacks({collection: Messages, options: makeEditableOptions})

function unArchiveConversations({document}) {
  Conversations.update({_id:document.conversationId}, {$set: {archivedByIds: []}});
}

addCallback('message.create.async', unArchiveConversations)
