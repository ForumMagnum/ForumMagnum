import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface MessagesViewTerms extends ViewTermsBase {
    view: MessagesViewName
    conversationId?: string
  }
}

//Messages for a specific conversation
function messagesConversation(terms: MessagesViewTerms) {
  return {
    selector: {conversationId: terms.conversationId},
    options: {sort: {createdAt: 1}}
  };
}

// latest messages for a conversation preview
function conversationPreview(terms: MessagesViewTerms) {
  return {
    selector: {conversationId: terms.conversationId},
    options: {sort: {createdAt: -1}}
  };
}

export const MessagesViews = new CollectionViewSet('Messages', {
  messagesConversation,
  conversationPreview
});
