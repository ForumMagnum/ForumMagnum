import React, { FC, ReactNode, createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { useMulti } from "../../lib/crud/withMulti";
import { hasForumEvents } from "../../lib/betas";

type ForumEventsContext = {
  currentAndRecentForumEvents: ForumEventsDisplay[],
  currentForumEvent: ForumEventsDisplay | null,
  activeForumEvents: ForumEventsDisplay[],
  isEventPost: (post: PostsBase, options?: { includeRecent?: boolean }) => ForumEventsDisplay | null,
  refetch?: () => void
};

const defaultValue: ForumEventsContext = {
  currentAndRecentForumEvents: [],
  currentForumEvent: null,
  activeForumEvents: [],
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

  // Derive the current forum event as the first event whose endDate is in the
  // future -- we know the start date is in the past from the view query.
  const now = new Date();
  const activeForumEvents = useMemo(() => {
    return forumEvents.filter(event => !event.endDate || new Date(event.endDate) >= now);
  }, [forumEvents, now]);

  const currentForumEvent = activeForumEvents[0] || null;

  const isEventPost = useCallback((
    post: PostsBase,
    { includeRecent = false }: { includeRecent?: boolean } = {},
  ): ForumEventsDisplay | null => {
    // Always count active events
    const activeEvent = activeForumEvents.find(event => event.tag && (post.tagRelevance?.[event.tag._id] ?? 0) >= 1);
    if (activeEvent) {
      return activeEvent;
    }
    // If we're including recent-but-past events, search all events (including past)
    if (includeRecent) {
      return forumEvents
        .find(event => event.tag && (post.tagRelevance?.[event.tag._id] ?? 0) >= 1)
        ?? null;
    }
    return null;
  }, [forumEvents, activeForumEvents]);

  const eventEnded = currentForumEvent
    ? currentForumEvent.endDate && currentForumEvent.endDate < new Date()
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
    activeForumEvents,
    isEventPost,
    refetch,
  }), [forumEvents, currentForumEvent, activeForumEvents, isEventPost, refetch]);

  return (
    <currentAndRecentForumEventsContext.Provider value={value}>
      {children}
    </currentAndRecentForumEventsContext.Provider>
  );
}

export const useCurrentAndRecentForumEvents = () => useContext(currentAndRecentForumEventsContext);
