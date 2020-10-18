import { getFragment } from '../vulcan-lib';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';

export const withCurrentUser = component => {

  return graphql(
    gql`
      query getCurrentUser {
        currentUser {
          ...UsersCurrent
        }
      }
      ${getFragment('UsersCurrent')}
    `, {
      alias: 'withCurrentUser',
      
      props(props: any) {
        const { data } = props;
        return {
          currentUserLoading: data.loading,
          currentUser: data.currentUser,
          currentUserData: data,
        };
      },
    }
  )(component);
};

export default withCurrentUser;
