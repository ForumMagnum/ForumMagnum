/**
 * @file UltraFeedObserver.tsx
 * 
 * This file implements a centralized IntersectionObserver system for the UltraFeed.
 * 
 * **Purpose:**
 * To efficiently track when feed items (posts, comments, etc.) become visible 
 * within the viewport for a sufficient duration (e.g., 300ms) to count as "viewed".
 * It also provides a mechanism (`trackExpansion`) to log when items are expanded.
 * 
 * **How it works:**
 * - It uses a single `IntersectionObserver` instance (`observerRef`) to monitor multiple 
 *   target elements (feed items) added via the `observe` function.
 * - `elementDataMapRef` stores metadata associated with each observed element.
 * - `timerMapRef` manages setTimeout timers for each element entering the viewport.
 * - When an element meets the intersection threshold (`INTERSECTION_THRESHOLD`) for 
 *   the required duration (`VIEW_THRESHOLD_MS`), a 'viewed' event is logged via 
 *   `createUltraFeedEvent`, the element is marked as viewed in `viewedItemsRef`, 
 *   and the observer stops watching it (`unobserve`).
 * - If an element leaves the viewport before the timer completes, the timer is cleared.
 * 
 * **Why this approach? (Performance Rationale):**
 * The primary alternative would be to instantiate a separate IntersectionObserver for 
 * each individual item rendered within `MixedTypeFeed.tsx`. However, a feed can contain 
 * hundreds or potentially thousands of items as the user scrolls. Creating and managing 
 * that many observers would be highly inefficient and could lead to significant 
 * performance degradation (increased memory usage, higher CPU load managing callbacks).
 * 
 * Using a single, centralized observer that monitors multiple targets is a much more 
 * performant pattern recommended by the Intersection Observer API documentation. 
 * This component acts as that central manager, providing a context (`useUltraFeedObserver`) 
 * for individual feed items to register themselves for observation without needing their 
 * own observer instances.
 */

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
import { gql } from "@/lib/generated/gql-codegen";
import { useTracking } from "../../lib/analyticsEvents";

const UltraFeedEventsDefaultFragmentMutation = gql(`
  mutation createUltraFeedEventUltraFeedObserver($data: CreateUltraFeedEventDataInput!) {
    createUltraFeedEvent(data: $data) {
      data {
        ...UltraFeedEventsDefaultFragment
      }
    }
  }
`);

type DocumentType = 'post' | 'comment' | 'spotlight';

interface ObserveData {
  documentId: string;
  documentType: DocumentType;
  postId?: string;
  servedEventId?: string;
  feedCardIndex?: number;
  feedCommentIndex?: number;
}

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

// Minimum amount of the element (in pixels) that must be inside the viewport to
// count as "visible enough" to register a view event.
export const MIN_VISIBLE_PX = 100;

const VIEW_THRESHOLD_MS = 1000;
const LONG_VIEW_THRESHOLD_MS = 10000;

const documentTypeToCollectionName = {
  post: "Posts",
  comment: "Comments",
  spotlight: "Spotlights"
} satisfies Record<DocumentType, "Posts" | "Comments" | "Spotlights">;

export const UltraFeedObserverProvider = ({ children, incognitoMode }: { children: ReactNode, incognitoMode: boolean }) => {
  const currentUser = useCurrentUser();
  const { captureEvent } = useTracking();
  
  const [createUltraFeedEvent] = useMutation(UltraFeedEventsDefaultFragmentMutation);
  
  const observerRef = useRef<IntersectionObserver | null>(null);

  const timerMapRef = useRef<Map<Element, { shortTimerId: ReturnType<typeof setTimeout> | null, longTimerId: ReturnType<typeof setTimeout> | null }>>(new Map());
  const elementDataMapRef = useRef<Map<Element, ObserveData>>(new Map());
  const longViewedItemsRef = useRef<Set<string>>(new Set());
  const shortViewedItemsRef = useRef<Set<string>>(new Set());

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

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      const element = entry.target;
      const elementData = elementDataMapRef.current.get(element);

      if (!elementData || longViewedItemsRef.current.has(elementData.documentId)) {
        return;
      }

      if (entry.isIntersecting) {
        if (!timerMapRef.current.has(element)) {
          if (!elementData) return;

          let shortTimerId: ReturnType<typeof setTimeout> | null = null;

          // 1s view (analytics)
          if (!shortViewedItemsRef.current.has(elementData.documentId)) {
            shortTimerId = setTimeout(() => {
              if (elementDataMapRef.current.has(element)) {
                logViewEvent(elementData, VIEW_THRESHOLD_MS);
                shortViewedItemsRef.current.add(elementData.documentId);
                const timers = timerMapRef.current.get(element);
                if (timers) timers.shortTimerId = null;
              }
            }, VIEW_THRESHOLD_MS);
          }

          // 10s view (long view analytics)
          const longTimerId = setTimeout(() => {
             if (elementDataMapRef.current.has(element)) {
               const currentElementData = elementDataMapRef.current.get(element);
               if (!currentElementData) return;

               logViewEvent(currentElementData, LONG_VIEW_THRESHOLD_MS);
               const documentId = currentElementData.documentId;
               longViewedItemsRef.current.add(documentId);
               
               observerRef.current?.unobserve(element);
               elementDataMapRef.current.delete(element);
               timerMapRef.current.delete(element);
             }
          }, LONG_VIEW_THRESHOLD_MS);

          timerMapRef.current.set(element, { shortTimerId, longTimerId });
        }
      } else {
        if (timerMapRef.current.has(element)) {
          const timers = timerMapRef.current.get(element)!;
          if (timers.shortTimerId) {
            clearTimeout(timers.shortTimerId);
          }
          if (timers.longTimerId) {
            clearTimeout(timers.longTimerId);
          }
          timerMapRef.current.delete(element);
        }
      }
    });
  }, [logViewEvent]);

  useEffect(() => {
    const currentTimerMap = timerMapRef.current;
    const currentElementDataMap = elementDataMapRef.current;
    const currentLongViewedItems = longViewedItemsRef.current;
    const currentShortViewedItems = shortViewedItemsRef.current;

    // We shrink the effective viewport by MIN_VISIBLE_PX on the top and bottom.
    // Consequently, `entry.isIntersecting === true` means the element has at
    // least MIN_VISIBLE_PX pixels (or its full height if smaller) visible.
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: `-${MIN_VISIBLE_PX}px 0px -${MIN_VISIBLE_PX}px 0px`,
      threshold: 0,
    });
    const observerInstance = observerRef.current;

    return () => {
      observerInstance?.disconnect();
      currentTimerMap.forEach(timers => {
        if (timers.shortTimerId) clearTimeout(timers.shortTimerId);
        if (timers.longTimerId) clearTimeout(timers.longTimerId);
      });
      currentTimerMap.clear();
      currentElementDataMap.clear();
      currentLongViewedItems.clear();
      currentShortViewedItems.clear();
    };
  }, [handleIntersection]);

  const observe = useCallback((element: Element, data: ObserveData) => {
    if (observerRef.current && !longViewedItemsRef.current.has(data.documentId) && !elementDataMapRef.current.has(element)) {
       elementDataMapRef.current.set(element, data);
       observerRef.current.observe(element);
    }
  }, []);

  const unobserve = useCallback((element: Element) => {
    if (observerRef.current && elementDataMapRef.current.has(element)) {
      observerRef.current.unobserve(element);
      if (timerMapRef.current.has(element)) {
        const timers = timerMapRef.current.get(element)!;
        if (timers.shortTimerId) clearTimeout(timers.shortTimerId);
        if (timers.longTimerId) clearTimeout(timers.longTimerId);
        timerMapRef.current.delete(element);
      }
      elementDataMapRef.current.delete(element);
    }
  }, []);

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
  if (!context) {
    throw new Error('useUltraFeedObserver must be used within an UltraFeedObserverProvider');
  }
  return context;
};
