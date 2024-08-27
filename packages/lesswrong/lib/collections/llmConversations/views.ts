import LLMConversations from './collection';
import { ensureIndex } from '@/lib/collectionIndexUtils';

declare global {
  interface LlmConversationsWithUserViewTerms {
    view: 'llmConversationsWithUser',
    userId: string | undefined
  }

  type LlmConversationsViewTerms = Omit<ViewTermsBase, 'view'> & (LlmConversationsWithUserViewTerms | {
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

ensureIndex(LLMConversations, { userId: 1, deleted: 1, createdAt: 1 });
