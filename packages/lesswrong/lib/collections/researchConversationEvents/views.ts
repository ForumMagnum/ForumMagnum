import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface ResearchConversationEventsViewTerms extends ViewTermsBase {
    view: ResearchConversationEventsViewName
    conversationId?: string
    sinceSeq?: number
  }
}

function byConversation(terms: ResearchConversationEventsByConversationInput) {
  const selector: AnyBecauseHard = { conversationId: terms.conversationId };
  if (typeof terms.sinceSeq === 'number') {
    selector.seq = { $gt: terms.sinceSeq };
  }
  return {
    selector,
    options: { sort: { seq: 1 as const } },
  };
}

export const ResearchConversationEventsViews = new CollectionViewSet('ResearchConversationEvents', {
  byConversation,
});
