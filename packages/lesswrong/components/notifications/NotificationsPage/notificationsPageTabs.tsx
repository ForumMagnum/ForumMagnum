import React, { FC, ReactNode, createContext, useCallback, useContext, useState } from "react";

export const notificationPageTabs = [
  {
    name: "all",
    type: undefined,
  },
  {
    name: "comments",
    type: "newComment",
  },
  {
    name: "new posts",
    type: "newPost",
  },
] as const;

export type NotificationsPageTab = typeof notificationPageTabs[number];

export type NotificationsPageTabName = NotificationsPageTab["name"];

export const isNotificationsPageTabName = (
  name: string,
): name is NotificationsPageTabName => {
  for (const tab of notificationPageTabs) {
    if (tab.name === name) {
      return true;
    }
  }
  return false;
}

type NotificationsPageTabContext = {
  tab: NotificationsPageTab,
  setTab: (tab: NotificationsPageTabName) => void,
}

const notificationsPageTabContext = createContext<NotificationsPageTabContext>({
  tab: notificationPageTabs[0],
  setTab: () => {},
});

export const NotificationsPageTabContextProvider: FC<{
  children: ReactNode,
}> = ({children}) => {
  const [tabIndex, setTabIndex] = useState<number>(0);
  const tab = notificationPageTabs[tabIndex] ?? notificationPageTabs[0];
  const setTab = useCallback((newTabName: NotificationsPageTabName) => {
    const newTabIndex = notificationPageTabs.findIndex(
      ({name}) => name === newTabName,
    );
    setTabIndex(newTabIndex >= 0 ? newTabIndex : 0);
  }, []);
  return (
    <notificationsPageTabContext.Provider value={{tab, setTab}}>
      {children}
    </notificationsPageTabContext.Provider>
  );
}

export const useNotificationsPageTab = () => useContext(notificationsPageTabContext);
