import { useQueryServer } from "@/server/useQueryServer";
import { type DocumentNode, type QueryHookOptions, type TypedDocumentNode, useQuery as useQueryApollo, type QueryResult, type OperationVariables } from "@apollo/client";

export function useQuery<TData=any, TVariables=OperationVariables>(
  query: DocumentNode|TypedDocumentNode<TData,TVariables>, options?: QueryHookOptions<TData, TVariables>
): Omit<QueryResult<TData, TVariables>, "client"|"startPolling"|"stopPolling"|"subscribeToMore"|"updateQuery"> {
  if (bundleIsServer && !options?.client) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQueryServer<TData, TVariables>(query, options);
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQueryApollo<TData, TVariables>(query, options);
  }
}
