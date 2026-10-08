import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface ResearchConversationsViewTerms extends ViewTermsBase {
    view: ResearchConversationsViewName
    projectId?: string
  }
}

function byProject(terms: ResearchConversationsByProjectInput) {
  return {
    selector: { projectId: terms.projectId, archived: false },
    options: { sort: { lastActivityAt: -1 as const } },
  };
}

function byProjectArchived(terms: ResearchConversationsByProjectArchivedInput) {
  return {
    selector: { projectId: terms.projectId, archived: true },
    options: { sort: { lastActivityAt: -1 as const } },
  };
}

export const ResearchConversationsViews = new CollectionViewSet('ResearchConversations', {
  byProject,
  byProjectArchived,
});
