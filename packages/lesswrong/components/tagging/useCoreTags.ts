import { useQuery, UseQueryOptions } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';

const TagFragmentMultiQuery = gql(`
  query multiTagCoreTagsChecklistQuery($selector: TagSelector, $limit: Int, $enableTotal: Boolean) {
    tags(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...TagFragment
      }
      totalCount
    }
  }
`);

export function useCoreTags(options?: UseQueryOptions) {
  return useQuery(TagFragmentMultiQuery, {
    variables: {
      selector: { coreTags: {} },
      limit: 100,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
    ...options,
  });
}
