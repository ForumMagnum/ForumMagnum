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

const VIEW_THRESHOLD_MS = 500;
const INTERSECTION_THRESHOLD = 0.5; // 50% visible

const mapDocumentTypeToCollectionName = (documentType: DocumentType): "Posts" | "Comments" | "Spotlights" => {
  const mapping: Record<DocumentType, "Posts" | "Comments" | "Spotlights"> = {
    'post': "Posts",
    'comment': "Comments",
    'spotlight': "Spotlights"
  };
  return mapping[documentType];
};

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
        // Start timer if not already running for this element
        if (!timerMapRef.current.has(element)) {
          const timerId = setTimeout(() => {
            // Check again if it's still being observed and hasn't been marked viewed
            if (elementDataMapRef.current.has(element) && !viewedItemsRef.current.has(elementData.documentId)) {
              // Include userId in the event data
              const eventData = {
                userId: currentUser._id,
                eventType: 'viewed' as const,
                documentId: elementData.documentId,
                collectionName: mapDocumentTypeToCollectionName(elementData.documentType),
              };

              // Use the create function from useCreate
              createUltraFeedEvent({
                data: eventData
              }).catch(err => {
                // eslint-disable-next-line no-console
                console.error("Failed to log UltraFeed 'viewed' event:", err);
              });

              // Mark as viewed and stop observing this specific element
              viewedItemsRef.current.add(elementData.documentId);
              observerRef.current?.unobserve(element);
              elementDataMapRef.current.delete(element); // Clean up data map
            }
            // Clean up timer map regardless
            timerMapRef.current.delete(element);
          }, VIEW_THRESHOLD_MS);
          timerMapRef.current.set(element, timerId);
        }
      } else {
        // Element is not intersecting sufficiently, clear its timer
        if (timerMapRef.current.has(element)) {
          clearTimeout(timerMapRef.current.get(element)!);
          timerMapRef.current.delete(element);
        }
      }
    });
  }, [createUltraFeedEvent, currentUser]);

  // Initialize observer on mount
  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root: null, // Use viewport
      threshold: INTERSECTION_THRESHOLD, // Trigger when 50% visible/hidden
    });

    // Capture the ref's current value for the cleanup function
    const currentTimerMap = timerMapRef.current;

    // Cleanup observer on unmount
    return () => {
      observerRef.current?.disconnect();
      // Clear any pending timers using the captured map
      currentTimerMap.forEach(clearTimeout);
      // Clear the maps/sets in the ref directly (this is fine)
      timerMapRef.current.clear();
      elementDataMapRef.current.clear();
      viewedItemsRef.current.clear();
    };
  }, [handleIntersection]);

  // Function for children to register themselves
  const observe = useCallback((element: Element, data: ObserveData) => {
    if (observerRef.current && !viewedItemsRef.current.has(data.documentId) && !elementDataMapRef.current.has(element)) {
       elementDataMapRef.current.set(element, data);
       observerRef.current.observe(element);
    }
  }, []);

  // Function for children to unregister
  const unobserve = useCallback((element: Element) => {
    if (observerRef.current && elementDataMapRef.current.has(element)) {
      observerRef.current.unobserve(element);
      // Clear any associated timer
      if (timerMapRef.current.has(element)) {
        clearTimeout(timerMapRef.current.get(element)!);
        timerMapRef.current.delete(element);
      }
      elementDataMapRef.current.delete(element); // Clean up data map
    }
  }, []);

  // Function for children to track expansion
  const trackExpansion = useCallback((data: TrackExpansionData) => {
    if (!currentUser) return;
    
    const eventData = {
      userId: currentUser._id,
      eventType: 'expanded' as const,
      documentId: data.documentId,
      collectionName: mapDocumentTypeToCollectionName(data.documentType),
      event: {
        expansionLevel: data.level,
        maxExpansionReached: data.maxLevelReached,
        wordCount: data.wordCount,
      },
    };

    // Use the create function from useCreate
    createUltraFeedEvent({
      data: eventData
    }).catch(err => {
      console.error("Failed to log UltraFeed 'expanded' event:", err);
    });
  }, [createUltraFeedEvent, currentUser]);

  const contextValue = { observe, unobserve, trackExpansion };

  return (
    <UltraFeedObserverContext.Provider value={contextValue}>
      {children}
    </UltraFeedObserverContext.Provider>
  );
};

// Custom hook to use the context
export const useUltraFeedObserver = () => {
  const context = useContext(UltraFeedObserverContext);
  if (!context) {
    throw new Error('useUltraFeedObserver must be used within an UltraFeedObserverProvider');
  }
  return context;
}; 