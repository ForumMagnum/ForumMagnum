import { CollectionViewSet } from '@/lib/views/collectionViewSet';
import type { ApolloClient } from "@apollo/client";

declare global {
  interface WorkspaceReposViewTerms extends ViewTermsBase {
    view: WorkspaceReposViewName
  }
}

function myRepos(_terms: WorkspaceReposViewTerms, _: ApolloClient | undefined, context?: ResolverContext) {
  if (!context?.currentUser?._id) {
    throw new Error("Cannot view workspace repos when not logged in");
  }

  return {
    selector: { userId: context.currentUser._id },
    options: { sort: { createdAt: -1 as const } },
  };
}

export const WorkspaceReposViews = new CollectionViewSet('WorkspaceRepos', {
  myRepos,
});
