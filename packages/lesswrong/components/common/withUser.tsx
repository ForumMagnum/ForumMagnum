import React, { ForwardedRef, createContext, forwardRef, useCallback, useContext, useRef } from 'react';
import { createContext as contextSelectorCreateContext, useContextSelector } from "use-context-selector";

export const UserContext = contextSelectorCreateContext<UsersCurrent|null>(null);
export const GetUserContext = createContext<()=>(UsersCurrent|null)>(() => null);

export const UserContextProvider = ({value, children}: {
  value: UsersCurrent|null
  children: React.ReactNode
}) => {
  const lastCurrentUser = useRef(value);
  lastCurrentUser.current = value;
  const getCurrentUser = useCallback(() => lastCurrentUser.current, []);

  return <UserContext.Provider value={value}>
    <GetUserContext.Provider value={getCurrentUser}>
      {children}
    </GetUserContext.Provider>
  </UserContext.Provider>
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

// Higher-order component for providing the currently logged in user, assuming
// the component is a descendant of Layout. This is much faster than Vulcan's
// withCurrentUser, which creates a graphql query for each component.
export default function withUser(Component: React.FC<WithUserProps>) {
  return forwardRef((props, ref) => {
    const currentUser = useCurrentUser();
    return <Component ref={ref} {...props} currentUser={currentUser} />
  })
}

export const RefetchCurrentUserContext = createContext<(_?: any) => Promise<any>>(async () => {});
export const useRefetchCurrentUser = () => useContext(RefetchCurrentUserContext);
