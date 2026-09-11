import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface ResearchConversationEventsViewTerms extends ViewTermsBase {
    view: ResearchConversationEventsViewName
    // Add your view terms here
  }
}

// Define your view functions here

export const ResearchConversationEventsViews = new CollectionViewSet('ResearchConversationEvents', {
  // Add your view functions here
});
