import React, { ForwardedRef, createContext, forwardRef, useCallback, useContext, useEffect, useRef } from 'react';
import { useContextSelector } from "use-context-selector";
import { UserContext } from './sharedContexts';
import { useQueryCurrentUser } from '@/lib/crud/withCurrentUser';
import { onUserChanged } from '@/client/logging';
import { localeSetting } from '@/lib/instanceSettings';
import moment from 'moment';

export const GetUserContext = createContext<()=>(UsersCurrent|null)>(() => null);

export const UserContextProvider = ({children}: {
  children: React.ReactNode
}) => {
  const {currentUser, refetchCurrentUser, currentUserLoading} = useQueryCurrentUser();
  
  const locale = localeSetting.get();

  useEffect(() => {
    onUserChanged(currentUser);
    moment.locale(locale);
  }, [currentUser, locale]);

  useEffect(() => {
    onUserChanged(currentUser);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?._id]);

  const lastCurrentUser = useRef(currentUser);
  lastCurrentUser.current = currentUser;
  const getCurrentUser = useCallback(() => lastCurrentUser.current, []);

  return (
    <RefetchCurrentUserContext.Provider value={refetchCurrentUser}>
    <UserContext.Provider value={currentUser}>
    <GetUserContext.Provider value={getCurrentUser}>
      {children}
    </GetUserContext.Provider>
    </UserContext.Provider>
    </RefetchCurrentUserContext.Provider>
  );
}

/**
 * React hook for getting the currently logged in user (or null, if not logged
 * in). Note that some components are meant to only be used if the user is
 * logged in; in that case, the component should take a non-null UsersCurrent
 * prop rather than getting it with useCurrentUser.
 */
export const useCurrentUser = () => useContextSelector(UserContext, u=>u);

export function useFilteredCurrentUser<T>(filter: (u: UsersCurrent|null) => T): T {
  return useContextSelector(UserContext, filter);
}

export const useGetCurrentUser = () => {
  return useContext(GetUserContext);
};

export const useCurrentUserId = () => useFilteredCurrentUser(u => u?._id);

interface WithUserProps {
  currentUser: UsersCurrent | null;
  ref: ForwardedRef<unknown>;
};


export const RefetchCurrentUserContext = createContext<(_?: any) => Promise<any>>(async () => {});
export const useRefetchCurrentUser = () => useContext(RefetchCurrentUserContext);
