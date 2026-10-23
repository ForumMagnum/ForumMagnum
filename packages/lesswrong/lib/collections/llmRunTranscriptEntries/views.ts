import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface LlmRunTranscriptEntriesViewTerms extends ViewTermsBase {
    view: LlmRunTranscriptEntriesViewName
    // Add your view terms here
  }
}

// Define your view functions here

export const LlmRunTranscriptEntriesViews = new CollectionViewSet('LlmRunTranscriptEntries', {
  // Add your view functions here
});
