import { useQuery as useQueryApollo, useSuspenseQuery } from "@apollo/client";
import type { SuspenseQueryHookFetchPolicy, FetchPolicy } from "@apollo/client";

type UseQueryOptions = {
  fetchPolicy: SuspenseQueryHookFetchPolicy,
  ssr: boolean,
};

export function wrappedUseQuery(query: any, options: UseQueryOptions) {
  if (bundleIsServer) {
    return useSuspenseQuery(query, options);
  } else {
    return useQueryApollo(query, options);
  }
}
