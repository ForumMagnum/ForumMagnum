import { addEditableCallbacks } from '../editor/make_editable_callbacks'
import Messages, { makeEditableOptions } from '../../lib/collections/messages/collection'
import Conversations from '../../lib/collections/conversations/collection'
import { getCollectionHooks } from '../mutationCallbacks';

addEditableCallbacks({collection: Messages, options: makeEditableOptions})

getCollectionHooks("Messages").createAsync.add(function unArchiveConversations({document}) {
  void Conversations.update({_id:document.conversationId}, {$set: {archivedByIds: []}});
});
