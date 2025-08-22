import { useQuery } from "@/lib/crud/useQuery";
import { gql } from '@/lib/generated/gql-codegen';
import { hookToHoc } from '../hocUtils';
import { useApolloClient } from "@apollo/client/react";

/**
 * Hook for a graphQL query that fetches the logged-in user object. This is
 * used once, in App.tsx, and then provided to the rest of the page as React
 * context which you can retrieve with useCurrentUser or withUser. Don't use
 * this directly; creating duplicate Apollo queries is much slower than using
 * the React context.
 */
export const useQueryCurrentUser = () => {
  const client = useApolloClient();
  const {data, refetch, loading} = useQuery(gql(`
    query getCurrentUser {
      currentUser {
        ...UsersCurrent
      }
    }
  `), {
    fetchPolicy: "cache-first",
    ssr: true,
  });
  
  return {
    currentUser: data?.currentUser ?? null,
    refetchCurrentUser: async () => {
      client.prioritizeCacheValues = false;
      await refetch();
    },
    currentUserLoading: loading,
  }
}

export const withCurrentUser = hookToHoc(useQueryCurrentUser);
