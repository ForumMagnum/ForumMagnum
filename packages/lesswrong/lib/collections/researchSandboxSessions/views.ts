import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface ResearchSandboxSessionsViewTerms extends ViewTermsBase {
    view: ResearchSandboxSessionsViewName
    conversationId?: string
  }
}

function byConversation(terms: ResearchSandboxSessionsByConversationInput) {
  return {
    selector: { conversationId: terms.conversationId },
  };
}

export const ResearchSandboxSessionsViews = new CollectionViewSet('ResearchSandboxSessions', {
  byConversation,
});
