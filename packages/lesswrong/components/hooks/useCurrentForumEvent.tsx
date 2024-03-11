import React, { FC, ReactNode, createContext, useContext, useMemo } from "react";
import { useMulti } from "../../lib/crud/withMulti";
import { isEAForum } from "../../lib/instanceSettings";

type CurrentForumEventContext = {
  currentForumEvent: ForumEventsDisplay | null,
}

const currentForumEventContext = createContext<CurrentForumEventContext>({
  currentForumEvent: null,
});

export const CurrentForumEventProvider: FC<{
  children: ReactNode,
}> = ({children}) => {
  const {results} = useMulti({
    collectionName: "ForumEvents",
    fragmentName: "ForumEventsDisplay",
    terms: {
      view: "currentForumEvent",
    },
    skip: !isEAForum,
  });
  const value = useMemo(() => {
    return {
      currentForumEvent: results?.[0] ?? null,
    };
  }, [results]);
  return (
    <currentForumEventContext.Provider value={value}>
      {children}
    </currentForumEventContext.Provider>
  );
}

export const useCurrentForumEvent = () => useContext(currentForumEventContext);
