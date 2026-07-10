import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface ResearchProjectsViewTerms extends ViewTermsBase {
    view: ResearchProjectsViewName
    // Add your view terms here
  }
}

// Define your view functions here

export const ResearchProjectsViews = new CollectionViewSet('ResearchProjects', {
  // Add your view functions here
});
