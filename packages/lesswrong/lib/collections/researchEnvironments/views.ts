import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface ResearchEnvironmentsViewTerms extends ViewTermsBase {
    view: ResearchEnvironmentsViewName
    projectId?: string
  }
}

function byProject(terms: ResearchEnvironmentsByProjectInput) {
  return {
    selector: { projectId: terms.projectId, archived: false },
    options: { sort: { createdAt: -1 as const } },
  };
}

function byProjectArchived(terms: ResearchEnvironmentsByProjectArchivedInput) {
  return {
    selector: { projectId: terms.projectId, archived: true },
    options: { sort: { createdAt: -1 as const } },
  };
}

export const ResearchEnvironmentsViews = new CollectionViewSet('ResearchEnvironments', {
  byProject,
  byProjectArchived,
});
