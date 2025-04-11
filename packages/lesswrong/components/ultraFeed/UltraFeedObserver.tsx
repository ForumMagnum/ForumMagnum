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
import { useCreate } from '../../lib/crud/withCreate';
import { useCurrentUser } from "../common/withUser";

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
const INTERSECTION_THRESHOLD = 0.5;

const documentTypeToCollectionName = {
  post: "Posts",
  comment: "Comments",
  spotlight: "Spotlights"
} satisfies Record<DocumentType, "Posts" | "Comments" | "Spotlights">;

export const UltraFeedObserverProvider = ({ children }: { children: ReactNode }) => {
  const currentUser = useCurrentUser();
  
  const { create: createUltraFeedEvent } = useCreate({
    collectionName: 'UltraFeedEvents',
    fragmentName: 'UltraFeedEventsDefaultFragment',
  });
  
  const observerRef = useRef<IntersectionObserver | null>(null);

  const timerMapRef = useRef<Map<Element, NodeJS.Timeout>>(new Map());
  const elementDataMapRef = useRef<Map<Element, ObserveData>>(new Map());
  const viewedItemsRef = useRef<Set<string>>(new Set());

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    if (!currentUser) return;
    
    entries.forEach((entry) => {
      const element = entry.target;
      const elementData = elementDataMapRef.current.get(element);

      if (!elementData || viewedItemsRef.current.has(elementData.documentId)) {
        return;
      }

      if (entry.isIntersecting && entry.intersectionRatio >= INTERSECTION_THRESHOLD) {
        if (!timerMapRef.current.has(element)) {
          const timerId = setTimeout(() => {
            if (elementDataMapRef.current.has(element) && !viewedItemsRef.current.has(elementData.documentId)) {
              const eventData = {
                userId: currentUser._id,
                eventType: 'viewed' as const,
                documentId: elementData.documentId,
                collectionName: documentTypeToCollectionName[elementData.documentType],
              };

              void createUltraFeedEvent({
                data: eventData
              });
              
              viewedItemsRef.current.add(elementData.documentId);
              observerRef.current?.unobserve(element);
              elementDataMapRef.current.delete(element);
            }
            timerMapRef.current.delete(element);
          }, VIEW_THRESHOLD_MS);
          timerMapRef.current.set(element, timerId);
        }
      } else {
        if (timerMapRef.current.has(element)) {
          clearTimeout(timerMapRef.current.get(element)!);
          timerMapRef.current.delete(element);
        }
      }
    });
  }, [createUltraFeedEvent, currentUser]);

  useEffect(() => {
    // Capture current ref values inside the effect
    const currentTimerMap = timerMapRef.current;
    const currentElementDataMap = elementDataMapRef.current;
    const currentViewedItems = viewedItemsRef.current;

    // Create and assign the observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null,
      threshold: INTERSECTION_THRESHOLD,
    });
    // Capture the specific observer instance created in *this* effect run
    const observerInstance = observerRef.current;

    // Cleanup function uses the captured values
    return () => {
      observerInstance?.disconnect();
      currentTimerMap.forEach(clearTimeout);
      currentTimerMap.clear();
      currentElementDataMap.clear();
      currentViewedItems.clear();
    };
  }, [handleIntersection]);

  const observe = useCallback((element: Element, data: ObserveData) => {
    if (observerRef.current && !viewedItemsRef.current.has(data.documentId) && !elementDataMapRef.current.has(element)) {
       elementDataMapRef.current.set(element, data);
       observerRef.current.observe(element);
    }
  }, []);

  const unobserve = useCallback((element: Element) => {
    if (observerRef.current && elementDataMapRef.current.has(element)) {
      observerRef.current.unobserve(element);
      if (timerMapRef.current.has(element)) {
        clearTimeout(timerMapRef.current.get(element)!);
        timerMapRef.current.delete(element);
      }
      elementDataMapRef.current.delete(element);
    }
  }, []);

  const trackExpansion = useCallback((data: TrackExpansionData) => {
    if (!currentUser) return;
    
    const eventData = {
      userId: currentUser._id,
      eventType: 'expanded' as const,
      documentId: data.documentId,
      collectionName: documentTypeToCollectionName[data.documentType],
      event: {
        expansionLevel: data.level,
        maxExpansionReached: data.maxLevelReached,
        wordCount: data.wordCount,
      },
    };

    void createUltraFeedEvent({
      data: eventData
    });
  }, [createUltraFeedEvent, currentUser]);

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
