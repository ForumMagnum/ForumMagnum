import React, { FC, ReactNode, createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { hasForumEvents } from "../../lib/betas";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";

const ForumEventsDisplayMultiQuery = gql(`
  query multiForumEventuseCurrentForumEventQuery($selector: ForumEventSelector, $limit: Int, $enableTotal: Boolean) {
    forumEvents(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ForumEventsDisplay
      }
      totalCount
    }
  }
`);

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
  // ea-forum-look-here FIXME: This query will waterfall with pageload
  const { data, refetch } = useQuery(ForumEventsDisplayMultiQuery, {
    variables: {
      selector: { currentAndRecentForumEvents: {} },
      limit: 10,
      enableTotal: false,
    },
    skip: !hasForumEvents,
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.forumEvents?.results;

  const forumEvents: ForumEventsDisplay[] = useMemo(() => results ?? [], [results]);
  
  // Derive the current forum event as the first event whose endDate is in the
  // future -- we know the start date is in the past from the view query.
  const now = new Date();
  const currentForumEvent = forumEvents.find(event => !event.endDate || new Date(event.endDate) >= now) || null;

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
    ? currentForumEvent.endDate && new Date(currentForumEvent.endDate) < new Date()
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
