import { ApolloError, MutationOptions as ApolloMutationOptions, useApolloClient } from "@apollo/client";
import { captureException } from "@sentry/core";
import { useCallback, useState } from "react";
import { useMessages } from "../common/withMessages";

type MutateOptions = ApolloMutationOptions & {
  errorHandling: "flashMessageAndReturn"|"handledManuallyWithReturnValue"|"loggedAndSilent"|"unloggedAndSilent"
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
 *
 *   flashMessageAndReturn: If the mutation fails, show it to the user and
 *     return {result: null, error: ...}. This is the easiest option and
 *     probably the one you want.
 *   handledManuallyWithReturnValue: If the mutation fails, it is included in
 *     the return value, and the caller represents that they're doing something
 *     to handle it. Use this if you want to customize how the error is
 *     displayed.
 *   loggedAndSilent: If the mutation fails, it will be logged to stderr and
 *     Sentry, and returned, but the caller represents that they will ignore
 *     the return value.
 *   unloggedAndSilent: If the mutation fails, it will be returned as in
 *     handleManuallyWithReturnValue, but the caller represents they're not
 *     doing anything with it. Use sparingly, only for mutations that are
 *     definitely expendable.
 *
 * The hook returns a `loading` flag which is true if at least one request is
 * pending.
 */
export function useMutate(): {
  mutate: MutateFn,
  loading: boolean
} {
  const apolloClient = useApolloClient();
  const {flash} = useMessages();
  const [numLoading,setNumLoading] = useState(0);
  
  const mutate =  useCallback(async (options: MutateOptions): Promise<MutateResult> => {
    try {
      setNumLoading(n => n+1);
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
          flash(error.message);
          return {
            result: null,
            error: error,
          };
        case "loggedAndSilent":
          // eslint-disable-next-line no-console
          console.error(error);
          captureException(error);
          return {
            result: null,
            error: error,
          };
        case "unloggedAndSilent":
        case "handledManuallyWithReturnValue":
          return {
            result: null,
            error: error,
          };
      }
    } finally {
      setNumLoading(n => n-1);
    }
  }, [apolloClient, flash]);
  
  return {
    mutate,
    loading: numLoading > 0,
  };
}
