import React, { createContext, useMemo, useState } from 'react';
import { useCurrentUser } from '../common/withUser';

interface HideNavigationSidebarContextType {
  hideNavigationSidebar: boolean
  setHideNavigationSidebar: (v: boolean) => void
}
export const HideNavigationSidebarContext = createContext<HideNavigationSidebarContextType|null>(null);
export const HideNavigationSidebarContextProvider = ({children}: {
  children: React.ReactNode
}) => {
  const currentUser = useCurrentUser();
  const hideNavigationSidebarDefault = currentUser ? !!(currentUser?.hideNavigationSidebar) : false
  const [hideNavigationSidebar,setHideNavigationSidebar] = useState(hideNavigationSidebarDefault);
  const context: HideNavigationSidebarContextType = useMemo(
    () => ({hideNavigationSidebar, setHideNavigationSidebar}),
    [hideNavigationSidebar, setHideNavigationSidebar]
  );

  return <HideNavigationSidebarContext value={context}>
    {children}
  </HideNavigationSidebarContext>
}
