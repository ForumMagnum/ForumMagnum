import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface ResearchSandboxSessionsViewTerms extends ViewTermsBase {
    view: ResearchSandboxSessionsViewName
    userId?: string
    projectId?: string
  }
}

function byUserAndProject(terms: ResearchSandboxSessionsByUserAndProjectInput) {
  return {
    selector: { userId: terms.userId, projectId: terms.projectId },
    options: { sort: { lastUsedAt: -1 as const } },
  };
}

export const ResearchSandboxSessionsViews = new CollectionViewSet('ResearchSandboxSessions', {
  byUserAndProject,
});
