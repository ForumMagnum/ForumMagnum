import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface ResearchEnvironmentsViewTerms extends ViewTermsBase {
    view: ResearchEnvironmentsViewName
    projectId?: string
  }
}

function byProject(terms: ResearchEnvironmentsByProjectInput) {
  return {
    selector: { projectId: terms.projectId },
    options: { sort: { createdAt: -1 as const } },
  };
}

export const ResearchEnvironmentsViews = new CollectionViewSet('ResearchEnvironments', {
  byProject,
});
