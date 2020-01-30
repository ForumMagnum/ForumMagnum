import React, { useContext } from 'react';

export const UserContext = React.createContext<UsersCurrent|null>(null);

export const useCurrentUser = () => useContext(UserContext);

// Higher-order component for providing the currently logged in user, assuming
// the component is a descendant of Layout. This is much faster than Vulcan's
// withCurrentUser, which creates a graphql query for each component.
export default function withUser(Component) {
  return function WithUserComponent(props) {
    const currentUser = useCurrentUser();
    return <Component {...props} currentUser={currentUser} />
  }
}
