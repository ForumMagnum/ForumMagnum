import Messages from "./collection"

declare global {
  interface MessagesViewTerms extends ViewTermsBase {
    view?: MessagesViewName
    conversationId?: string
  }
}


//Messages for a specific conversation
Messages.addView("messagesConversation", function (terms: MessagesViewTerms) {
  return {
    selector: {conversationId: terms.conversationId},
    options: {sort: {createdAt: 1}}
  };
});

// latest messages for a conversation preview
Messages.addView("conversationPreview", function (terms: MessagesViewTerms) {
  return {
    selector: {conversationId: terms.conversationId},
    options: {sort: {createdAt: -1}}
  };
});
