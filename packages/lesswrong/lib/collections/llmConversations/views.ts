import LLMConversations from './collection';
import { ensureIndex } from '@/lib/collectionIndexUtils';

declare global {
  type LlmConversationsViewTerms = Omit<ViewTermsBase, 'view'> & {
    view: 'llmConversationsWithUser',
    userId: string | undefined
  }
}

LLMConversations.addView("llmConversationsWithUser", function (terms: LlmConversationsViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      deleted: false
    }
  };
});

ensureIndex(LLMConversations, { userId: 1 })
