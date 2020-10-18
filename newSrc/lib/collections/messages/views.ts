import Messages from "./collection"
import { ensureIndex } from '../../collectionUtils';

//Messages for a specific conversation
Messages.addView("messagesConversation", function (terms) {
  return {
    selector: {conversationId: terms.conversationId},
    options: {sort: {createdAt: 1}}
  };
});
ensureIndex(Messages, { conversationId:1, createdAt:1 });

// latest messages for a conversation preview
Messages.addView("conversationPreview", function (terms) {
  return {
    selector: {conversationId: terms.conversationId},
    options: {sort: {createdAt: -1}}
  };
});
