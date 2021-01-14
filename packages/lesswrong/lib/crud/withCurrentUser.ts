import { fragmentTextForQuery } from '../vulcan-lib/fragments';
import { useQuery } from '@apollo/client';
import { hookToHoc } from '../hocUtils';
import gql from 'graphql-tag';

export const useQueryCurrentUser = () => {
  const {data, loading} = useQuery(gql`
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
    currentUser: data?.currentUser,
    currentUserLoading: loading,
  }
}

export const withCurrentUser = hookToHoc(useQueryCurrentUser);
