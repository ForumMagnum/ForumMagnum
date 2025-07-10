'use client';

import { ForwardedRef, createContext, useContext } from 'react';
import { ApolloQueryResult, NetworkStatus, OperationVariables } from '@apollo/client';
import { UserContext } from './sharedContexts';

// React hook for getting the currently logged in user (or null, if not logged
// in). Note that some components are meant to only be used if the user is
// logged in; in that case, the component should take a non-null UsersCurrent
// prop rather than getting it with useCurrentUser.
export const useCurrentUser = () => useContext(UserContext);

interface WithUserProps {
  currentUser: UsersCurrent | null;
  ref: ForwardedRef<unknown>;
};


export const RefetchCurrentUserContext = createContext<(_?: any) => Promise<any>>(async () => {});
export const useRefetchCurrentUser = () => useContext(RefetchCurrentUserContext);
