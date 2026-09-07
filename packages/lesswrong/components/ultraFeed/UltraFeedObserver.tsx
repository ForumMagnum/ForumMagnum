/** Tracks comment/post exposure separately from delivery and expansion. */

import React, {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
  useMemo,
} from 'react';
import { useCurrentUser } from "../common/withUser";
import { useMutation } from "@apollo/client/react";
import { useTracking } from "../../lib/analyticsEvents";
import { UltraFeedEventCreateMutation } from './ultraFeedMutations';
import { UltraFeedViewTracker, type ObserveData } from './ultraFeedViewTracker';
import { useUltraFeedContext } from './UltraFeedContextProvider';

export const MIN_VISIBLE_PX = 100;

interface TrackExpansionData {
  documentId: string;
  documentType: 'post' | 'comment';
  postId?: string;
  level: number;
  maxLevelReached: boolean;
  wordCount: number;
  servedEventId?: string;
  feedCardIndex?: number;
  feedCommentIndex?: number;
}

interface UltraFeedObserverContextType {
  observe: (element: Element, data: ObserveData) => void;
  unobserve: (element: Element) => void;
  trackExpansion: (data: TrackExpansionData) => void;
}

const UltraFeedObserverContext = createContext<UltraFeedObserverContextType | null>(null);

const documentTypeToCollectionName = {
  post: "Posts",
  comment: "Comments",
  spotlight: "Spotlights"
} satisfies Record<DocumentType, "Posts" | "Comments" | "Spotlights">;

export const UltraFeedObserverProvider = ({ children, incognitoMode, activeFeedType, paused = false }: {
  children: ReactNode;
  incognitoMode: boolean;
  activeFeedType?: string;
  paused?: boolean;
}) => {
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();
  
  const [createUltraFeedEvent] = useMutation(UltraFeedEventCreateMutation);
  
  const logViewEvent = useCallback((elementData: ObserveData, durationMs: number) => {
    if (incognitoMode || !elementData) return;

    const eventPayload = {
      data: {
        eventType: 'viewed' as const,
        documentId: elementData.documentId,
        collectionName: documentTypeToCollectionName[elementData.documentType],
        feedItemId: elementData.servedEventId,
        event: { 
          durationMs: durationMs
        }
      }
    };
    
    void createUltraFeedEvent({ variables: eventPayload });
    
    captureEvent("ultraFeedItemViewed", {
      documentId: elementData.documentId,
      collectionName: documentTypeToCollectionName[elementData.documentType],
      durationMs: durationMs,
      feedItemId: elementData.servedEventId,
      feedCardIndex: elementData.feedCardIndex,
      feedCommentIndex: elementData.feedCommentIndex,
    });
  }, [createUltraFeedEvent, incognitoMode, captureEvent]);

  // Keep the tracker and its target registrations stable across callback/settings changes.
  const logViewEventRef = useRef(logViewEvent);
  logViewEventRef.current = logViewEvent;
  const trackerRef = useRef<UltraFeedViewTracker | null>(null);
  if (!trackerRef.current) {
    trackerRef.current = new UltraFeedViewTracker((data, duration) => logViewEventRef.current(data, duration));
  }
  const tracker = trackerRef.current;

  useEffect(() => {
    tracker.connect();
    return () => tracker.disconnect();
  }, [tracker]);

  useEffect(() => {
    const updateVisibility = () => tracker.setEnabled(!incognitoMode && !paused && document.visibilityState !== 'hidden');
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, [tracker, incognitoMode, paused]);

  useEffect(() => tracker.setActiveFeedType(activeFeedType), [tracker, activeFeedType]);

  const observe = useCallback((element: Element, data: ObserveData) => tracker.observe(element, data), [tracker]);
  const unobserve = useCallback((element: Element) => tracker.unobserve(element), [tracker]);

  const trackExpansion = useCallback((data: TrackExpansionData) => {
    if (!currentUser || incognitoMode) return;
    
    const eventData = {
      data: {
        userId: currentUser._id,
        eventType: 'expanded' as const,
        documentId: data.documentId,
        collectionName: documentTypeToCollectionName[data.documentType],
        feedItemId: data.servedEventId,
        event: {
          expansionLevel: data.level,
          maxExpansionReached: data.maxLevelReached,
          wordCount: data.wordCount,
        }
      }
    };
    void createUltraFeedEvent({ variables: eventData });
    
    captureEvent("ultraFeedItemExpanded", {
      documentId: data.documentId,
      collectionName: documentTypeToCollectionName[data.documentType],
      expansionLevel: data.level,
      feedItemId: data.servedEventId,
      feedCardIndex: data.feedCardIndex,
      feedCommentIndex: data.feedCommentIndex,
    });
  }, [createUltraFeedEvent, currentUser, incognitoMode, captureEvent]);

  const contextValue = useMemo(() => ({ 
    observe, 
    unobserve, 
    trackExpansion,
  }), [observe, unobserve, trackExpansion]);

  return (
    <UltraFeedObserverContext.Provider value={contextValue}>
      {children}
    </UltraFeedObserverContext.Provider>
  );
};

export const useUltraFeedObserver = () => {
  const context = useContext(UltraFeedObserverContext);
  const { feedType } = useUltraFeedContext();
  const register = context?.observe;
  const observe = useCallback((element: Element, data: ObserveData) => {
    register?.(element, { ...data, feedType });
  }, [register, feedType]);
  if (!context) {
    throw new Error('useUltraFeedObserver must be used within an UltraFeedObserverProvider');
  }
  return { ...context, observe };
};
