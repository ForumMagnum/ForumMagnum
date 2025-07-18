import { useEffect, useRef, useCallback } from 'react';
import { captureEvent } from '../../lib/analyticsEvents';

interface ViewTrackingOptions {
  documentId: string;
  documentType: 'post' | 'comment' | 'tag';
  index?: number;
  wordCount?: number;
}

const VIEW_THRESHOLD_MS = 2000;
const LONG_VIEW_THRESHOLD_MS = 10000;

/**
 * Hook to track view duration for Recent Discussion items.
 * Captures analytics events when items are viewed for 2s and 10s.
 */
export function useRecentDiscussionViewTracking({
  documentId,
  documentType,
  index,
  wordCount,
}: ViewTrackingOptions) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longViewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoggedViewRef = useRef(false);
  const hasLoggedLongViewRef = useRef(false);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const entry = entries[0];
    
    if (entry.isIntersecting) {
      // Start timers when element becomes visible
      if (!hasLoggedViewRef.current) {
        viewTimerRef.current = setTimeout(() => {
          captureEvent('recentDiscussionItemViewed', {
            documentId,
            documentType,
            durationMs: VIEW_THRESHOLD_MS,
            index,
            wordCount,
          });
          hasLoggedViewRef.current = true;
        }, VIEW_THRESHOLD_MS);
      }
      
      if (!hasLoggedLongViewRef.current) {
        longViewTimerRef.current = setTimeout(() => {
          captureEvent('recentDiscussionItemLongViewed', {
            documentId,
            documentType,
            durationMs: LONG_VIEW_THRESHOLD_MS,
            index,
            wordCount,
          });
          hasLoggedLongViewRef.current = true;
        }, LONG_VIEW_THRESHOLD_MS);
      }
    } else {
      // Clear timers when element leaves viewport
      if (viewTimerRef.current) {
        clearTimeout(viewTimerRef.current);
        viewTimerRef.current = null;
      }
      if (longViewTimerRef.current) {
        clearTimeout(longViewTimerRef.current);
        longViewTimerRef.current = null;
      }
    }
  }, [documentId, documentType, index, wordCount]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create observer with same margins as UltraFeed (250px threshold)
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: '-250px 0px -250px 0px',
      threshold: 0,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
      if (longViewTimerRef.current) clearTimeout(longViewTimerRef.current);
    };
  }, [handleIntersection]);

  return elementRef;
} 
