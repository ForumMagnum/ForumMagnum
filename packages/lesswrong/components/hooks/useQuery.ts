import { useApolloClient, useQuery as apolloUseQuery, NetworkStatus } from "@apollo/client";
import type { ApolloError, QueryHookOptions, DocumentNode, TypedDocumentNode, OperationVariables } from "@apollo/client";

export function useQueryWrapped<TData=any, TVariables=OperationVariables>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: QueryHookOptions<TData, TVariables>
): {
  data?: TData,
  error?: ApolloError,
  loading: boolean,
  refetch: any,
  fetchMore: any,
  networkStatus: NetworkStatus,
}{
  if (bundleIsServer) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const apolloClient = useApolloClient();

    if (options?.skip) {
      return {
        data: undefined,
        loading: true,
        refetch: async ()=>{},
        fetchMore: ()=>{},
        networkStatus: NetworkStatus.loading,
      };
    }
    
    const existingResult = apolloClient.readQuery({ query, variables: options?.variables });
    if (existingResult) {
      return {
        data: existingResult,
        loading: false,
        refetch: async ()=>{},
        fetchMore: ()=>{},
        networkStatus: NetworkStatus.ready,
      };
    } else {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      return apolloUseQuery<TData,TVariables>(query, options);
    }
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return apolloUseQuery<TData,TVariables>(query, options);
  }
}
