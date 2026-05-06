import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface ResearchDocumentsViewTerms extends ViewTermsBase {
    view: ResearchDocumentsViewName
    projectId?: string
  }
}

function byProject(terms: ResearchDocumentsByProjectInput) {
  return {
    selector: { projectId: terms.projectId },
    options: { sort: { createdAt: -1 as const } },
  };
}

export const ResearchDocumentsViews = new CollectionViewSet('ResearchDocuments', {
  byProject,
});
