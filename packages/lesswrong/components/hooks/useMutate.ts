import { ApolloError, MutationOptions as ApolloMutationOptions, useApolloClient } from "@apollo/client";
import { useCallback } from "react";
import { useMessages } from "../common/withMessages";

type MutateOptions = ApolloMutationOptions & {
  errorHandling: "flashMessageAndReturn"|"errorInReturnValue"
}
type MutateResult =
  { result: AnyBecauseHard, error: null }
  | { result: null, error: ApolloError }
type MutateFn = (options: MutateOptions) => Promise<MutateResult>

/**
 * Hook to get a function for performing graphql mutations. This is similar to
 * apollo-client's useMutation, except that you provide the query when you call
 * the mutate function, rather than providing the query when you call the hook.
 *
 * This is more performant than Apollo's `useMutation` because it doesn't have
 * to parse graphql until you actually run the query. It also makes error
 * handling easier (and forces you to think a nonzero amount about error
 * handling).
 *
 * In addition to ApolloMutationOptions, the options passed to the callback
 * include a mandatory field `errorHandling`, which is either:
 *   flashMessageAndReturn: If the mutation fails, show it to the user and
 *     return {result: null, error: ...}. This is the easiest option and
 *     probably the one you want.
 *   errorInReturnValue: If the mutation fails, it is included in the return
 *     value, but not shown to the user. Use this if you want to customize
 *     how the error is displayed.
 */
export function useMutate(): MutateFn {
  const apolloClient = useApolloClient();
  const messages = useMessages();
  
  return useCallback(async (options: MutateOptions): Promise<MutateResult> => {
    try {
      const result = await apolloClient.mutate(options);
      return {
        result,
        error: null,
      };
    } catch(error) {
      //eslint-disable-next-line no-console
      console.error(error);

      switch (options.errorHandling) {
        case "flashMessageAndReturn":
          messages.flash(error.message);
          return {
            result: null,
            error: error,
          };
        case "errorInReturnValue":
          return {
            result: null,
            error: error,
          };
      }
    }
  }, [apolloClient, messages]);
}
