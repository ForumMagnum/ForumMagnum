import { fragmentTextForQuery } from '../vulcan-lib/fragments';
import { gql, useSuspenseQuery } from '@apollo/client';
import { hookToHoc } from '../hocUtils';
//import { useQuery } from './useQuery';

/**
 * HoC for a graphQL that fetches the logged-in user object. This is used once,
 * in App.tsx, and then provided to the rest of the page as React context which
 * you can retrieve with useCurrentUser or withUser. Don't use this directly;
 * creating duplicate Apollo queries is much slower than using the React
 * context.
 */
export const useQueryCurrentUser = () => {
  const {data, refetch} = useSuspenseQuery(gql`
    query getCurrentUser {
      currentUser {
        ...UsersCurrent
      }
    }
    ${fragmentTextForQuery('UsersCurrent')}
  `, {
    fetchPolicy: "cache-first",
    ssr: true,
  });
  
  return {
    currentUser: (data as any).currentUser,
    refetchCurrentUser: refetch as any,
    currentUserLoading: false,
  }
}

export const withCurrentUser = hookToHoc(useQueryCurrentUser);
