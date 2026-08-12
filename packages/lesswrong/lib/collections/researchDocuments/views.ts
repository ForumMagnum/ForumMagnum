import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface ResearchDocumentsViewTerms extends ViewTermsBase {
    view: ResearchDocumentsViewName
    projectId?: string
  }
}

function byProject(terms: ResearchDocumentsByProjectInput) {
  return {
    selector: { projectId: terms.projectId, archived: false },
    options: { sort: { createdAt: -1 as const } },
  };
}

function byProjectArchived(terms: ResearchDocumentsByProjectArchivedInput) {
  return {
    selector: { projectId: terms.projectId, archived: true },
    options: { sort: { createdAt: -1 as const } },
  };
}

export const ResearchDocumentsViews = new CollectionViewSet('ResearchDocuments', {
  byProject,
  byProjectArchived,
});
