import { CollectionViewSet } from '../../../lib/views/collectionViewSet';
import type { ApolloClient, NormalizedCacheObject } from '@apollo/client';

declare global {
  interface UserMostValuablePostsViewTerms extends ViewTermsBase {
    view: UserMostValuablePostsViewName
    userId?: string,
    postId?: string
  }
}

function currentUserMostValuablePosts(_terms: UserMostValuablePostsViewTerms, _: ApolloClient<NormalizedCacheObject>, context?: ResolverContext) {
  return {
    selector: {
      userId: context?.currentUser?._id
    }
  };
}

function currentUserPost(terms: UserMostValuablePostsViewTerms, _: ApolloClient<NormalizedCacheObject>, context?: ResolverContext) {
  return {
    selector: {
      userId: context?.currentUser?._id,
      postId: terms.postId
    }
  };
}

export const UserMostValuablePostsViews = new CollectionViewSet('UserMostValuablePosts', {
  currentUserMostValuablePosts,
  currentUserPost
});
