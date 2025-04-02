import { useRef, useEffect, useCallback } from 'react';
import { useMutation } from '@apollo/client'; // Or your Vulcan equivalent
import gql from 'graphql-tag';

// Define the event data structure (can be simplified for mutation input)
interface UltraFeedEventInput {
  eventType: 'viewed' | 'expanded';
  documentId: string;
  documentType: 'post' | 'comment' | 'spotlight';
  postId?: string; // Relevant for comments
  // Fields specific to 'expanded'
  expansionLevel?: number;
  maxExpansionReached?: boolean;
  wordCount?: number;
}

// Define a placeholder mutation - replace with your actual mutation
const LOG_ULTRA_FEED_EVENT = gql`
  mutation LogUltraFeedEvent($input: UltraFeedEventInput!) {
    logUltraFeedEvent(input: $input) {
      # Optionally return something, like the created event ID or just success
      _id
    }
  }
`;

// Define the event payload types
interface UltraFeedViewedEventPayload {
  documentId: string;
  documentType: 'post' | 'comment' | 'spotlight';
  postId?: string; // Relevant for comments
}

interface UltraFeedExpandedEventPayload {
  documentId: string;
  documentType: 'post' | 'comment'; // Spotlights don't expand this way
  postId?: string; // Relevant for comments
  expansionLevel: number;
  maxExpansionReached: boolean;
  wordCount: number;
}

// Extend the global AnalyticsEvents interface if necessary, or ensure these event names are handled by your tracking setup
// This might not be needed if not using the client-side analytics system
// declare global {
//   interface AnalyticsEvents {
//     ultraFeedItemViewed: UltraFeedViewedEventPayload; // Keep if used elsewhere
//     ultraFeedItemExpanded: UltraFeedExpandedEventPayload; // Keep if used elsewhere
//   }
// }

interface UseUltraFeedLoggingOptions {
  documentId: string;
  documentType: 'post' | 'comment' | 'spotlight';
  postId?: string; // Pass postId for comments
  enabled?: boolean; // Allow disabling tracking easily
}

const VIEW_THRESHOLD_MS = 500; // Minimum time on screen to trigger 'viewed'

export const useUltraFeedLogging = ({
  documentId,
  documentType,
  postId,
  enabled = true,
}: UseUltraFeedLoggingOptions) => {
  // Replace useTracking with useMutation
  // const { captureEvent } = useTracking();
  const [logEventMutation] = useMutation(LOG_ULTRA_FEED_EVENT);

  // Explicitly type the ref for HTMLDivElement or a more generic HTMLElement
  const targetRef = useRef<HTMLDivElement | null>(null);
  const viewedSentRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanUpObserver = useRef<() => void>(() => {});

  useEffect(() => {
    // Type assertion to ensure targetRef.current is compatible with IntersectionObserver's observe method
    const currentElement = targetRef.current as Element | null;
    if (!enabled || !currentElement || viewedSentRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (!timerRef.current) {
              timerRef.current = setTimeout(() => {
                if (!viewedSentRef.current) {
                  // console.log(`[DB Logging] Sending 'viewed' for ${documentType}:${documentId}`);
                  // Call the mutation for 'viewed'
                  const eventInput: UltraFeedEventInput = {
                    eventType: 'viewed',
                    documentId,
                    documentType,
                    ...(postId && { postId }),
                  };
                  logEventMutation({ variables: { input: eventInput } }).catch(err => {
                    console.error("Failed to log UltraFeed 'viewed' event:", err);
                  });

                  viewedSentRef.current = true;
                  observer.disconnect();
                }
                timerRef.current = null;
              }, VIEW_THRESHOLD_MS);
            }
          } else {
            if (timerRef.current) {
              clearTimeout(timerRef.current);
              timerRef.current = null;
            }
          }
        });
      },
      {
        root: null,
        threshold: 0.5,
      }
    );

    // Observe the element
    observer.observe(currentElement);

    cleanUpObserver.current = () => {
      observer.disconnect();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    return () => {
      cleanUpObserver.current();
    };
  // Add logEventMutation to dependency array if linting requires, though it should be stable
  }, [enabled, documentId, documentType, postId, logEventMutation]);

  const trackExpansion = useCallback(
    (level: number, maxLevelReached: boolean, wordCount: number) => {
      if (!enabled) return;
      // console.log(`[DB Logging] Sending 'expanded' for ${documentType}:${documentId}`);
      // Call the mutation for 'expanded'
      const eventInput: UltraFeedEventInput = {
        eventType: 'expanded',
        documentId,
        documentType: documentType as 'post' | 'comment',
        ...(postId && { postId }),
        expansionLevel: level,
        maxExpansionReached: maxLevelReached,
        wordCount,
      };
       logEventMutation({ variables: { input: eventInput } }).catch(err => {
         console.error("Failed to log UltraFeed 'expanded' event:", err);
       });
    },
    // Add logEventMutation to dependency array if linting requires
    [enabled, logEventMutation, documentId, documentType, postId]
  );

  return { elementRef: targetRef, trackExpansion };
}; 