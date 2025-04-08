import { useRef, useEffect, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import gql from 'graphql-tag';

interface UltraFeedEventInput {
  eventType: 'viewed' | 'expanded';
  documentId: string;
  documentType: 'post' | 'comment' | 'spotlight';
  postId?: string;
  expansionLevel?: number;
  maxExpansionReached?: boolean;
  wordCount?: number;
}

const LOG_ULTRA_FEED_EVENT = gql`
  mutation LogUltraFeedEvent($input: UltraFeedEventInput!) {
    logUltraFeedEvent(input: $input) {
      # Optionally return something, like the created event ID or just success
      _id
    }
  }
`;



interface UseUltraFeedLoggingOptions {
  documentId: string;
  documentType: 'post' | 'comment' | 'spotlight';
  postId?: string;
  enabled?: boolean;
}

const VIEW_THRESHOLD_MS = 500; // Minimum time on screen to trigger 'viewed'

export const useUltraFeedLogging = ({
  documentId,
  documentType,
  postId,
  enabled = true,
}: UseUltraFeedLoggingOptions) => {
  const [logEventMutation] = useMutation(LOG_ULTRA_FEED_EVENT);

  const targetRef = useRef<HTMLDivElement | null>(null);
  const viewedSentRef = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const cleanUpObserver = useRef<() => void>(() => {});

  useEffect(() => {
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
                  const eventInput: UltraFeedEventInput = {
                    eventType: 'viewed',
                    documentId,
                    documentType,
                    ...(postId && { postId }),
                  };
                  logEventMutation({ variables: { input: eventInput } }).catch(err => {
                    // eslint-disable-next-line no-console
                    console.log("Failed to log UltraFeed 'viewed' event:", err);
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
  }, [enabled, documentId, documentType, postId, logEventMutation]);

  const trackExpansion = useCallback(
    (level: number, maxLevelReached: boolean, wordCount: number) => {
      if (!enabled) return;
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
        // eslint-disable-next-line no-console
        console.log("Failed to log UltraFeed 'expanded' event:", err);
      });
    },
    [enabled, logEventMutation, documentId, documentType, postId]
  );

  return { elementRef: targetRef, trackExpansion };
}; 
