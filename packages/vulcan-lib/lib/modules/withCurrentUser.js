import React, { Component, useContext } from 'react';
import { getFragment } from 'meteor/vulcan:lib';
import { graphql, useQuery } from 'react-apollo';
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
      
      props(props) {
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

export const UserContext = React.createContext('currentUser');
export const useCurrentUser = () => useContext(UserContext);

// Higher-order component for providing the currently logged in user, assuming
// the component is a descendant of Layout. This is much faster than Vulcan's
// withCurrentUser, which creates a graphql query for each component.
export function withUser(Component) {
  return function WithUserComponent(props) {
    return (
      <UserContext.Consumer>
        {user => <Component {...props} currentUser={user} />}
      </UserContext.Consumer>
    );
  }
}

export const UserContextWrapper = ({children, currentUser}) => {
  const { data } = useQuery(gql`
    query getCurrentUser {
      currentUser {
        ...UsersCurrent
      }
    }
    ${getFragment('UsersCurrent')}
  `);
  
  return (
    <UserContext.Provider value={data ? data.currentUser : null}>
      {children}
    </UserContext.Provider>
  );
}

export default withCurrentUser;
