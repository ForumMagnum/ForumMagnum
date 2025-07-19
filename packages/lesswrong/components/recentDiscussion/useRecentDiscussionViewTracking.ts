import { useEffect, useRef, useCallback } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { MIN_VISIBLE_PX } from '../ultraFeed/UltraFeedObserver';

interface ViewTrackingOptions {
  documentId: string;
  documentType: 'post' | 'comment' | 'tag';
}

const VIEW_THRESHOLD_MS = 1000;
const LONG_VIEW_THRESHOLD_MS = 10000;

/**
 * Hook to track view duration for Recent Discussion items.
 * Captures analytics events when items are viewed for 2s and 10s.
 */
export function useRecentDiscussionViewTracking({
  documentId,
  documentType,
}: ViewTrackingOptions) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const viewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longViewTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoggedViewRef = useRef(false);
  const hasLoggedLongViewRef = useRef(false);
  const { captureEvent } = useTracking();

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
  }, [documentId, documentType, captureEvent]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Create observer with same margins as UltraFeed
    const observer = new IntersectionObserver(handleIntersection, {
      rootMargin: `-${MIN_VISIBLE_PX}px 0px -${MIN_VISIBLE_PX}px 0px`,
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
