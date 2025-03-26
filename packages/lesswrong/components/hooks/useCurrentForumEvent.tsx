import React, { FC, ReactNode, createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useMulti } from "../../lib/crud/withMulti";
import { hasForumEvents } from "../../lib/betas";

type ForumEventsContext = {
  currentAndRecentForumEvents: ForumEventsDisplay[],
  currentForumEvent: ForumEventsDisplay | null,
  isEventPost: (post: PostsBase, options?: { includeRecent?: boolean }) => ForumEventsDisplay | null,
  refetch?: () => void
};

const defaultValue: ForumEventsContext = {
  currentAndRecentForumEvents: [],
  currentForumEvent: null,
  isEventPost: () => null,
};

const currentAndRecentForumEventsContext = createContext<ForumEventsContext>(defaultValue);

export const CurrentAndRecentForumEventsProvider: FC<{
  children: ReactNode,
}> = ({children}) => {
  const {results, refetch} = useMulti({
    collectionName: "ForumEvents",
    fragmentName: "ForumEventsDisplay",
    terms: {
      view: "currentAndRecentForumEvents",
    },
    skip: !hasForumEvents,
  });

  const forumEvents: ForumEventsDisplay[] = useMemo(() => results ?? [], [results]);
  // console.log('🚀 ~ forumEvents:', forumEvents)
  
  // Derive the current forum event as the first event whose endDate is in the
  // future -- we know the start date is in the past from the view query.
  const now = new Date();
  const fakecurrentevent = forumEvents[0] ?? undefined
  // console.log('🚀 ~ fakecurrentevent.endDate and typeof:', fakecurrentevent?.endDate, typeof fakecurrentevent?.endDate)
  const currentForumEvent = forumEvents.find(event => new Date(event.endDate) >= now) || null;
  // console.log('🚀 ~ currentForumEvent:', currentForumEvent)

  const isEventPost = useCallback((
    post: PostsBase,
    { includeRecent = false }: { includeRecent?: boolean } = {},
  ): ForumEventsDisplay | null => {
    // First search current event -- if we have it that's the one we want
    const currentEventTag = currentForumEvent?.tag;
    if (currentEventTag && post.tagRelevance?.[currentEventTag._id] >= 1) {
      return currentForumEvent;
    }
    // If we're including recent-but-past events, search them all
    if (includeRecent) {
      return forumEvents
        .find(event => event.tag && (post.tagRelevance?.[event.tag._id] ?? 0) >= 1)
        ?? null;
    }
    return null;
  }, [forumEvents, currentForumEvent]);

  const eventEnded = currentForumEvent
    ? currentForumEvent.endDate < new Date()
    : true;

  // Refetch on mount if forum events are enabled, and when the current event ends
  useEffect(() => {
    if (hasForumEvents) {
      void refetch();
    }
  }, [refetch, eventEnded]);

  const value = useMemo(() => ({
    currentAndRecentForumEvents: forumEvents,
    currentForumEvent,
    isEventPost,
    refetch,
  }), [forumEvents, currentForumEvent, isEventPost, refetch]);

  return (
    <currentAndRecentForumEventsContext.Provider value={value}>
      {children}
    </currentAndRecentForumEventsContext.Provider>
  );
}

export const useCurrentAndRecentForumEvents = () => useContext(currentAndRecentForumEventsContext);
