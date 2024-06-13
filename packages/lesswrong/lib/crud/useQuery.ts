import { useQuery as useQueryApollo, useSuspenseQuery, WatchQueryFetchPolicy } from "@apollo/client";
import type { SuspenseQueryHookFetchPolicy, FetchPolicy } from "@apollo/client";

type UseQueryOptions = {
  fetchPolicy?: SuspenseQueryHookFetchPolicy & WatchQueryFetchPolicy,
  ssr: boolean,
};

export function wrappedUseQuery(query: any, options: UseQueryOptions) {
  if (bundleIsServer) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSuspenseQuery(query, options);
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQueryApollo(query, options);
  }
}
