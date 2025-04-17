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
} from 'react';
import { gql } from "@apollo/client";
import { useCurrentUser } from "../common/withUser";
import { useCreate } from "../../lib/crud/withCreate";

type DocumentType = 'post' | 'comment' | 'spotlight';

interface ObserveData {
  documentId: string;
  documentType: DocumentType;
  postId?: string; // Relevant for comments
}

interface TrackExpansionData {
  documentId: string;
  documentType: 'post' | 'comment';
  postId?: string;
  level: number;
  maxLevelReached: boolean;
  wordCount: number;
}

interface UltraFeedObserverContextType {
  observe: (element: Element, data: ObserveData) => void;
  unobserve: (element: Element) => void;
  trackExpansion: (data: TrackExpansionData) => void;
}

const UltraFeedObserverContext = createContext<UltraFeedObserverContextType | null>(null);

const VIEW_THRESHOLD_MS = 300;
const LONG_VIEW_THRESHOLD_MS = 2000;
const INTERSECTION_THRESHOLD = 0.5;

const documentTypeToCollectionName = {
  post: "Posts",
  comment: "Comments",
  spotlight: "Spotlights"
} satisfies Record<DocumentType, "Posts" | "Comments" | "Spotlights">;

export const UltraFeedObserverProvider = ({ children, incognitoMode }: { children: ReactNode, incognitoMode: boolean }) => {
  const currentUser = useCurrentUser();
  
  const { create: createUltraFeedEvent } = useCreate({
    collectionName: "UltraFeedEvents",
    fragmentName: 'UltraFeedEventsDefaultFragment',
  });
  
  const observerRef = useRef<IntersectionObserver | null>(null);

  const timerMapRef = useRef<Map<Element, { shortTimerId: NodeJS.Timeout | null, longTimerId: NodeJS.Timeout | null }>>(new Map());
  const elementDataMapRef = useRef<Map<Element, ObserveData>>(new Map());
  const longViewedItemsRef = useRef<Set<string>>(new Set());
  const shortViewedItemsRef = useRef<Set<string>>(new Set());

  const logViewEvent = useCallback((elementData: ObserveData, durationMs: number) => {
    if (!currentUser || incognitoMode || !elementData) return;

    const eventPayload = {
      data: {
        eventType: 'viewed' as const,
        documentId: elementData.documentId,
        collectionName: documentTypeToCollectionName[elementData.documentType],
        event: { 
          durationMs: durationMs
        }
      }
    };
    void createUltraFeedEvent(eventPayload);
  }, [createUltraFeedEvent, currentUser, incognitoMode]);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    if (!currentUser || incognitoMode) return;
    
    entries.forEach((entry) => {
      const element = entry.target;
      const elementData = elementDataMapRef.current.get(element);

      if (!elementData || longViewedItemsRef.current.has(elementData.documentId)) {
        return;
      }

      if (entry.isIntersecting && entry.intersectionRatio >= INTERSECTION_THRESHOLD) {
        if (!timerMapRef.current.has(element)) {
          let shortTimerId: NodeJS.Timeout | null = null;
          if (!shortViewedItemsRef.current.has(elementData.documentId)) {
            shortTimerId = setTimeout(() => {
              if (elementDataMapRef.current.has(element)) {
                logViewEvent(elementData, VIEW_THRESHOLD_MS);
                shortViewedItemsRef.current.add(elementData.documentId);
                const timers = timerMapRef.current.get(element);
                if (timers) {
                  timers.shortTimerId = null;
                }
              }
            }, VIEW_THRESHOLD_MS);
          }

          const longTimerId = setTimeout(() => {
             if (elementDataMapRef.current.has(element)) {
               logViewEvent(elementData, LONG_VIEW_THRESHOLD_MS);
               longViewedItemsRef.current.add(elementData.documentId);
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
  }, [logViewEvent, currentUser, incognitoMode]);

  useEffect(() => {
    const currentTimerMap = timerMapRef.current;
    const currentElementDataMap = elementDataMapRef.current;
    const currentLongViewedItems = longViewedItemsRef.current;
    const currentShortViewedItems = shortViewedItemsRef.current;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null,
      threshold: INTERSECTION_THRESHOLD,
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
        event: {
          expansionLevel: data.level,
          maxExpansionReached: data.maxLevelReached,
          wordCount: data.wordCount,
        }
      }
    };
    void createUltraFeedEvent(eventData);
  }, [createUltraFeedEvent, currentUser, incognitoMode]);

  const contextValue = { observe, unobserve, trackExpansion };

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
