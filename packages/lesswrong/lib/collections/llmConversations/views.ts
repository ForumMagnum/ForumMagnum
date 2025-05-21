import { CollectionViewSet } from '../../../lib/views/collectionViewSet';

declare global {
  interface LlmConversationsWithUserViewTerms {
    view: 'llmConversationsWithUser',
    userId: string | undefined
  }

  interface LlmConversationsAllViewTerms {
    view: 'llmConversationsAll',
    showDeleted?: boolean
  }

  type LlmConversationsViewTerms = Omit<ViewTermsBase, 'view'> & (LlmConversationsWithUserViewTerms | LlmConversationsAllViewTerms |{
    view?: undefined,
    userId?: never
  })
}

function llmConversationsWithUser(terms: LlmConversationsWithUserViewTerms) {
  return {
    selector: {
      userId: terms.userId,
      deleted: false
    }
  };
}

function llmConversationsAll(terms: LlmConversationsAllViewTerms) {
  return {
    selector: {
      deleted: terms.showDeleted ? undefined : false
    },
    options: {
      sort: {
        createdAt: -1
      }
    }
  };
}

export const LlmConversationsViews = new CollectionViewSet('LlmConversations', {
  llmConversationsWithUser,
  llmConversationsAll
});
