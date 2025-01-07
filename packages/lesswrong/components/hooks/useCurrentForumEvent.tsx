import React, { FC, ReactNode, createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useMulti } from "../../lib/crud/withMulti";
import { hasForumEvents } from "../../lib/betas";

type CurrentForumEventContext = {
  currentForumEvent: ForumEventsDisplay | null,
  isEventPost: (post: PostsBase, tag?: TagBasicInfo | null) => boolean,
  refetch?: () => void
}

const defaultValue: CurrentForumEventContext = {
  currentForumEvent: null,
  isEventPost: () => false,
};

const currentForumEventContext = createContext<CurrentForumEventContext>(defaultValue);

export const CurrentForumEventProvider: FC<{
  children: ReactNode,
}> = ({children}) => {
  const {results, refetch} = useMulti({
    collectionName: "ForumEvents",
    fragmentName: "ForumEventsDisplay",
    terms: {
      view: "currentForumEvent",
    },
    skip: !hasForumEvents,
  });
  const currentForumEvent = results?.[0] ?? null;

  const isEventPost = useCallback((post: PostsBase, tag?: TagBasicInfo | null) => {
    tag ??= currentForumEvent?.tag;
    if (!tag) {
      return false;
    }
    return (post.tagRelevance?.[tag._id] ?? 0) >= 1;
  }, [currentForumEvent]);

  const eventEnded = currentForumEvent
    ? currentForumEvent.endDate < new Date()
    : true;

  useEffect(() => {
    if (hasForumEvents) {
      void refetch();
    }
  }, [refetch, eventEnded]);

  const value = useMemo(() => {
    return eventEnded
      ? defaultValue
      : {
        currentForumEvent,
        isEventPost,
        refetch,
      };
  }, [currentForumEvent, isEventPost, refetch, eventEnded]);

  return (
    <currentForumEventContext.Provider value={value}>
      {children}
    </currentForumEventContext.Provider>
  );
}

export const useCurrentForumEvent = () => useContext(currentForumEventContext);
