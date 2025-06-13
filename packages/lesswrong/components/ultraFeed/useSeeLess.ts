import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { gql } from '@/lib/generated/gql-codegen';
import { useCurrentUser } from '../common/withUser';
import { captureEvent } from '@/lib/analyticsEvents';
import { recombeeApi } from '@/lib/recombee/client';
import { FeedbackOptions } from './SeeLessFeedback';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';

const updateUltraFeedEventMutation = gql(`
  mutation updateUltraFeedEvent($selector: String!, $data: UpdateUltraFeedEventDataInput!) {
    updateUltraFeedEvent(selector: $selector, data: $data) {
      data {
        _id
      }
    }
  }
`);

interface UseSeeLessOptions {
  documentId: string;
  documentType: 'post' | 'comment';
  recommId?: string;
}

export const useSeeLess = ({ documentId, documentType, recommId }: UseSeeLessOptions) => {
  const currentUser = useCurrentUser();
  const [isSeeLessMode, setIsSeeLessMode] = useState(false);
  const [seeLessEventId, setSeeLessEventId] = useState<string | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<FeedbackOptions | null>(null);
  const [updateUltraFeedEvent] = useMutation(updateUltraFeedEventMutation);

  const handleSeeLess = useCallback((eventId: string) => {
    setIsSeeLessMode(true);
    if (eventId !== 'pending') {
      setSeeLessEventId(eventId);
    }
  }, []);

  const handleUndoSeeLess = useCallback(async () => {
    if (!currentUser) return;
    
    setIsSeeLessMode(false);
    
    if (seeLessEventId && seeLessEventId !== 'pending') {
      await updateUltraFeedEvent({
        variables: {
          selector: seeLessEventId,
          data: { 
            event: { cancelled: true }
          }
        }
      });
    }
    
    // Send neutral rating to Recombee to undo the downvote (posts only)
    if (documentType === 'post' && recommId) {
      void recombeeApi.createRating(
        documentId,
        currentUser._id,
        "neutral",
        recommId
      );
    }
    
    captureEvent("ultraFeedSeeLessUndone", {
      [`${documentType}Id`]: documentId,
      eventId: seeLessEventId,
    });
    
    setSeeLessEventId(null);
  }, [currentUser, seeLessEventId, documentId, documentType, recommId, updateUltraFeedEvent]);

  const debouncedFeedbackUpdate = useDebouncedCallback(async (feedback: FeedbackOptions) => {
    if (!seeLessEventId || seeLessEventId === 'pending') return;
    
    await updateUltraFeedEvent({
      variables: {
        selector: seeLessEventId,
        data: { 
          event: { feedbackReasons: feedback }
        }
      }
    });
    
    captureEvent("ultraFeedSeeLessFeedback", {
      [`${documentType}Id`]: documentId,
      eventId: seeLessEventId,
      feedback: { ...feedback },
    });
  }, {
    rateLimitMs: 1000,
    callOnLeadingEdge: false,
    onUnmount: "callIfScheduled",
    allowExplicitCallAfterUnmount: false,
  });

  const handleFeedbackChange = useCallback(async (feedback: FeedbackOptions) => {
    // Don't send updates until we have a real event ID
    if (!seeLessEventId || seeLessEventId === 'pending') {
      setPendingFeedback(feedback);
      return;
    }
    
    debouncedFeedbackUpdate(feedback);
  }, [seeLessEventId, debouncedFeedbackUpdate]);

  useEffect(() => {
    if (seeLessEventId && seeLessEventId !== 'pending' && pendingFeedback) {
      void handleFeedbackChange(pendingFeedback);
      setPendingFeedback(null);
    }
  }, [seeLessEventId, pendingFeedback, handleFeedbackChange]);

  return {
    isSeeLessMode,
    seeLessEventId,
    handleSeeLess,
    handleUndoSeeLess,
    handleFeedbackChange,
  };
}; 
