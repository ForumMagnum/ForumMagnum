import React, { FC, ReactNode, createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useMulti } from "../../lib/crud/withMulti";
import { hasForumEvents } from "../../lib/betas";
import { useSingle } from "@/lib/crud/withSingle";
import { isProduction } from "@/lib/executionEnvironment";
import { isEAForum } from "@/lib/instanceSettings";

type CurrentForumEventContext = {
  currentForumEvent: ForumEventsDisplay | null,
  isEventPost: (post: PostsBase, tag?: TagBasicInfo | null) => boolean,
  refetch?: () => void
  marginalFundingWeek: ForumEventsDisplay | null,
}

const defaultValue: CurrentForumEventContext = {
  currentForumEvent: null,
  isEventPost: () => false,
  marginalFundingWeek: null,
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

  const {document: marginalFundingWeek = null} = useSingle({
    collectionName: "ForumEvents",
    fragmentName: "ForumEventsDisplay",
    documentId: isProduction ? "BkpY8huZKGykawEG9" : "93kPzFTBEmE8Jsxrs",
    skip: !isEAForum,
  });

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
        marginalFundingWeek,
      };
  }, [currentForumEvent, isEventPost, refetch, eventEnded, marginalFundingWeek]);

  return (
    <currentForumEventContext.Provider value={value}>
      {children}
    </currentForumEventContext.Provider>
  );
}

export const useCurrentForumEvent = () => useContext(currentForumEventContext);
