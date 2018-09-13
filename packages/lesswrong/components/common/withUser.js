import React from 'react';

export const UserContext = React.createContext('currentUser');

export default function withUser(Component) {
  return function WithUserCompoent(props) {
    return (
      <UserContext.Consumer>
        {user => <Component {...props} currentUser={user} />}
      </UserContext.Consumer>
    );
  }
}
