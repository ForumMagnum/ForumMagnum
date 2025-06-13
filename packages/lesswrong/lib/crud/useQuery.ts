import { createContext, useContext } from "react";
// eslint-disable-next-line no-restricted-imports
import { useQuery as useQueryApollo, useSuspenseQuery } from "@apollo/client/react";
import type { SuspenseQueryHookFetchPolicy } from "@apollo/client/react";

export const EnableSuspenseContext = createContext(false);

type UseQueryOptions = {
  fetchPolicy: SuspenseQueryHookFetchPolicy,
  ssr?: boolean,
  skip?: boolean,
};

export const useQuery: typeof useQueryApollo = ((query: any, options: UseQueryOptions) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (bundleIsServer && useContext(EnableSuspenseContext)) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useSuspenseQuery(query, options);
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = useQueryApollo(query, options);
    return {
      ...result,
      loading: result.loading && !options.skip,
    };
  }
}) as any;
