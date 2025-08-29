import { gql } from "@/lib/generated/gql-codegen";
import { createClient } from '@/server/vulcan-lib/apollo-ssr/apolloClient';
import { computeContextFromUser } from '@/server/vulcan-lib/apollo-server/context';
import type { PostsRevision } from "@/lib/generated/gql-codegen/graphql";

// GraphQL Queries
export const PostsRevisionMultiQuery = gql(`
  query multiPostPostsEmailQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean, $version: String) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsRevision
      }
      totalCount
    }
  }
`);

// Data-fetching functions
export async function fetchPostsForEmail(postIds: string[], user: DbUser | null): Promise<PostsRevision[]> {
  const context = computeContextFromUser({ user, isSSR: false });
  const apolloClient = await createClient(context);
  
  const { data } = await apolloClient.query({
    query: PostsRevisionMultiQuery,
    variables: {
      selector: { default: { exactPostIds: postIds } },
      limit: postIds.length,
      enableTotal: false,
    },
  });

  return data?.posts?.results ?? [];
}
