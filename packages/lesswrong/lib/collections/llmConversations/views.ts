import LLMConversations from './collection';
import { ensureIndex } from '@/lib/collectionIndexUtils';



declare global {
  interface LlmConversationsWithUserViewTerms {
    view: 'llmConversationsWithUser',
    userId: string | undefined
  }

  interface LlmConversationsAllViewTerms {
    view: 'llmConversationsAll'
  }

  type LlmConversationsViewTerms = Omit<ViewTermsBase, 'view'> & (LlmConversationsWithUserViewTerms | LlmConversationsAllViewTerms |{
    view?: undefined,
    userId?: never
  })

}

LLMConversations.addView("llmConversationsWithUser", function (terms: LlmConversationsWithUserViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      deleted: false
    }
  };
});

LLMConversations.addView("llmConversationsAll", function (terms: LlmConversationsAllViewTerms) {
  return {
    options: {
      sort: {
        createdAt: -1
      }
  }
}});

ensureIndex(LLMConversations, { userId: 1, deleted: 1, createdAt: 1 });

