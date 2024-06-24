import { useQuery as useQueryApollo, useSuspenseQuery, WatchQueryFetchPolicy } from "@apollo/client";
import type { SuspenseQueryHookFetchPolicy, FetchPolicy } from "@apollo/client";
import { createContext, useContext } from "react";

export const EnableSuspenseContext = createContext(false);

type UseQueryOptions = {
  fetchPolicy?: SuspenseQueryHookFetchPolicy & WatchQueryFetchPolicy,
  ssr: boolean,
};

export function wrappedUseQuery(query: any, options: UseQueryOptions) {
  if (bundleIsServer && useContext(EnableSuspenseContext)) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSuspenseQuery(query, options);
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQueryApollo(query, options);
  }
}
