import { fragmentTextForQuery } from '../vulcan-lib/fragments';
import { useQuery, gql } from '@apollo/client';
import { hookToHoc } from '../hocUtils';

export const getCurrentUserQuery = () => gql`
  query getCurrentUser {
    currentUser {
      ...UsersCurrent
    }
  }
  ${fragmentTextForQuery('UsersCurrent')}
`;

/**
 * HoC for a graphQL that fetches the logged-in user object. This is used once,
 * in App.tsx, and then provided to the rest of the page as React context which
 * you can retrieve with useCurrentUser or withUser. Don't use this directly;
 * creating duplicate Apollo queries is much slower than using the React
 * context.
 */
export const useQueryCurrentUser = () => {
  const {data, refetch, loading} = useQuery(getCurrentUserQuery(), {
    fetchPolicy: "cache-first",
    ssr: true,
  });
  
  return {
    currentUser: data?.currentUser,
    refetchCurrentUser: refetch,
    currentUserLoading: loading,
  }
}

export const withCurrentUser = hookToHoc(useQueryCurrentUser);
