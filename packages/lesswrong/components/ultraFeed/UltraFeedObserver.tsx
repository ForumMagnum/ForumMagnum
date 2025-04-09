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
        if (!timerMapRef.current.has(element)) {
          const timerId = setTimeout(() => {
            if (elementDataMapRef.current.has(element) && !viewedItemsRef.current.has(elementData.documentId)) {
              const eventData = {
                userId: currentUser._id,
                eventType: 'viewed' as const,
                documentId: elementData.documentId,
                collectionName: mapDocumentTypeToCollectionName(elementData.documentType),
              };

              createUltraFeedEvent({
                data: eventData
              }).catch(err => {
                // eslint-disable-next-line no-console
                console.error("Failed to log UltraFeed 'viewed' event:", err);
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
      collectionName: mapDocumentTypeToCollectionName(data.documentType),
      event: {
        expansionLevel: data.level,
        maxExpansionReached: data.maxLevelReached,
        wordCount: data.wordCount,
      },
    };

    createUltraFeedEvent({
      data: eventData
    }).catch(err => {
      // eslint-disable-next-line no-console
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

export const useUltraFeedObserver = () => {
  const context = useContext(UltraFeedObserverContext);
  if (!context) {
    throw new Error('useUltraFeedObserver must be used within an UltraFeedObserverProvider');
  }
  return context;
};
