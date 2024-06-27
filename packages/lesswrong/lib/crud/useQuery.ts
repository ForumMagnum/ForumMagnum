// eslint-disable-next-line no-restricted-imports
import { ApolloClient, OperationVariables, useQuery as useQueryApollo, useSuspenseQuery, WatchQueryFetchPolicy } from "@apollo/client";
import { createContext, useContext } from "react";

export const EnableSuspenseContext = createContext(false);

type UseQueryOptions = {
  fetchPolicy?: WatchQueryFetchPolicy,
  nextFetchPolicy?: WatchQueryFetchPolicy,
  variables?: any,
  ssr?: boolean,
  skip?: boolean,
  notifyOnNetworkStatusChange?: boolean
  client?: ApolloClient<any>,
};

export function useQueryWrapped<TData=any,TVariables extends OperationVariables=any>(query: any, options?: UseQueryOptions) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (bundleIsServer && useContext(EnableSuspenseContext)) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const suspenseQueryResult = useSuspenseQuery<TData,TVariables>(query, options);

    return {
      ...suspenseQueryResult,
      loading: false,
    };
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQueryApollo<TData,TVariables>(query, options);
  }
}
