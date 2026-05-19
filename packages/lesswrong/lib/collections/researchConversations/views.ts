import { CollectionViewSet } from '@/lib/views/collectionViewSet';

declare global {
  interface ResearchConversationsViewTerms extends ViewTermsBase {
    view: ResearchConversationsViewName
    projectId?: string
    kind?: string
  }
}

function byProject(terms: ResearchConversationsByProjectInput) {
  return {
    selector: { projectId: terms.projectId },
    options: { sort: { lastActivityAt: -1 as const } },
  };
}

function byProjectAndEntrypointKind(terms: ResearchConversationsByProjectAndEntrypointKindInput) {
  return {
    selector: {
      projectId: terms.projectId,
      entrypointKind: terms.kind,
    },
    options: { sort: { lastActivityAt: -1 as const } },
  };
}

export const ResearchConversationsViews = new CollectionViewSet('ResearchConversations', {
  byProject,
  byProjectAndEntrypointKind,
});
