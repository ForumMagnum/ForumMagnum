import { CollectionViewSet } from '@/lib/views/collectionViewSet';
import type { ApolloClient } from "@apollo/client";

declare global {
  interface UserSecretsViewTerms extends ViewTermsBase {
    view: UserSecretsViewName
  }
}

function mySecrets(_terms: UserSecretsViewTerms, _: ApolloClient | undefined, context?: ResolverContext) {
  if (!context?.currentUser?._id) {
    throw new Error("Cannot view user secrets when not logged in");
  }

  return {
    selector: { userId: context.currentUser._id },
    options: { sort: { name: 1 as const } },
  };
}

export const UserSecretsViews = new CollectionViewSet('UserSecrets', {
  mySecrets,
});
