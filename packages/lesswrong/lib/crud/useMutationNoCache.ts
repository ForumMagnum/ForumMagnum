import { useApolloClient } from "@apollo/client/react";
import type { DocumentNode, OperationVariables } from "@apollo/client";
import type { VariablesOption } from "@apollo/client/utilities/internal";
import { useCallback } from "react";

/**
 * Hook for performing a graphql mutation, where the result is not merged into
 * the apollo cache. Under apollo-client v3, this would correspond to passing
 * the `ignoreResults` option to useMutatin; that flag no longer exists.
 */
export function useMutationNoCache<TVariables extends OperationVariables=any>(
  query: DocumentNode
) {
  const client = useApolloClient();
  const mutate = useCallback((options: VariablesOption<TVariables>) => {
    return client.mutate({
      mutation: query,
      ...options,
    });
  }, [query, client]);

  return [mutate];
}
