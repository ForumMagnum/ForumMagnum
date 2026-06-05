import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface ResearchSandboxSessionsViewTerms extends ViewTermsBase {
    view: ResearchSandboxSessionsViewName
    // Add your view terms here
  }
}

// Define your view functions here

export const ResearchSandboxSessionsViews = new CollectionViewSet('ResearchSandboxSessions', {
  // Add your view functions here
});
