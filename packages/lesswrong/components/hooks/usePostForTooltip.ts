import { useQuery, UseQueryOptions } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';

export const PostsListQuery = gql(`
  query PostsPreviewTooltipSingle($documentId: String) {
    post(input: { selector: { documentId: $documentId } }) {
      result {
        ...PostsList
      }
    }
  }
`);

export function usePostForTooltip(postId: string | undefined, options?: Omit<UseQueryOptions, 'fetchPolicy'>) {
  const result = useQuery(PostsListQuery, {
    variables: { documentId: postId },
    fetchPolicy: 'cache-first',
    ...options,
  });

  return result;
}
