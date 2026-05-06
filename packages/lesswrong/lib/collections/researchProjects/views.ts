import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface ResearchProjectsViewTerms extends ViewTermsBase {
    view: ResearchProjectsViewName
    userId?: string
  }
}

function byUser(terms: ResearchProjectsByUserInput) {
  return {
    selector: { userId: terms.userId },
    options: { sort: { createdAt: -1 as const } },
  };
}

export const ResearchProjectsViews = new CollectionViewSet('ResearchProjects', {
  byUser,
});
