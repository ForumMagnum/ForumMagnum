import Messages from "./collection.js"
import { ensureIndex } from '../../collectionUtils';

//Messages for a specific conversation
Messages.addView("messagesConversation", function (terms) {
  return {
    selector: {conversationId: terms.conversationId},
    options: {sort: {createdAt: 1}}
  };
});
ensureIndex(Messages, { conversationId:1, createdAt:1 });
