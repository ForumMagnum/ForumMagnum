import { CollectionViewSet } from '@/lib/views/collectionViewSet';
import type { ApolloClient } from "@apollo/client";

declare global {
  interface WorkspaceReposViewTerms extends ViewTermsBase {
    view: WorkspaceReposViewName
  }
}

// Append-only: a repo's current config is the most recent row in its
// `(host, owner, name)` group. Clients sort by createdAt and pick the most
// recent per repo.
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
