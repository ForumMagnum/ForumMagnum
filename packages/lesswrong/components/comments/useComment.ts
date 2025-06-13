import { isValidBase36Id } from '../../lib/utils/base36id';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const CommentsListMultiQuery = gql(`
  query multiCommentuseCommentQuery($selector: CommentSelector, $limit: Int, $enableTotal: Boolean) {
    comments(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...CommentsList
      }
      totalCount
    }
  }
`);

export const useCommentByLegacyId = ({ legacyId, ssr=true }: { legacyId: string, ssr?: boolean }): {
  comment: CommentsList|null,
  loading: boolean,
  error: any,
}=> {
  const isValidId = isValidBase36Id(legacyId);
  
  const { data, error, loading } = useQuery(CommentsListMultiQuery, {
    variables: {
      selector: { legacyIdComment: { legacyId: legacyId } },
      limit: 1,
      enableTotal: false,
    },
    skip: !isValidId,
    notifyOnNetworkStatusChange: true,
    ssr,
  });

  const results = data?.comments?.results;
  
  if (!isValidId) {
    return {
      comment: null,
      loading: false,
      error: "Invalid ID"
    };
  } else if (results && results.length>0 && results[0]._id) {
    return {
      comment: results[0],
      loading: false,
      error: null
    };
  } else {
    return {
      comment: null,
      loading, error
    }
  }
}
