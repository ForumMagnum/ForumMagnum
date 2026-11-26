import { CollectionViewSet } from '@/lib/views/collectionViewSet';
import { viewTermsToQuery } from '@/lib/utils/viewUtils';
import { PostsViews } from '../posts/views';
import type { ApolloClient } from '@apollo/client';

declare global {
  interface PingbacksViewTerms extends ViewTermsBase {
    view: PingbacksViewName
    postId?: string
  }
}

function defaultView(terms: PingbacksViewTerms) {
  return {
    selector: {
      deleted: false,
    },
  };
}

async function pingbacksToPost(terms: PingbacksViewTerms, _: ApolloClient | undefined, context: ResolverContext) {
  if (!terms.postId) {
    throw new Error("Invalid pingbacksToPost view: postId is required");
  }
  const sourcePostsQuery = await viewTermsToQuery(PostsViews, { view: "pingbackPosts", postId: terms.postId }, undefined, context);
  const sourcePosts = await context.Posts.find(sourcePostsQuery.selector, sourcePostsQuery.options, { _id: 1 }).fetch();
  return {
    selector: {
      targetPostId: terms.postId,
      sourcePostId: { $in: sourcePosts.map(post => post._id) },
    },
    options: {
      sort: { baseScore: -1 },
    },
  };
}

export const PingbacksViews = new CollectionViewSet('Pingbacks', {
  pingbacksToPost,
}, defaultView);
