import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation } from '@apollo/client/react';
import { gql } from '@/lib/generated/gql-codegen';
import { useCurrentUser } from '../common/withUser';
import { useTracking } from '@/lib/analyticsEvents';
import { recombeeApi } from '@/lib/recombee/client';
import { FeedbackOptions } from './SeeLessFeedback';
import { useDebouncedCallback } from '../hooks/useDebouncedCallback';
import { FeedCommentMetaInfo, FeedPostMetaInfo } from './ultraFeedTypes';

const createUltraFeedEventMutation = gql(`
  mutation createUltraFeedEventSeeLess($data: CreateUltraFeedEventDataInput!) {
    createUltraFeedEvent(data: $data) {
      data {
        ...UltraFeedEventsDefaultFragment
      }
    }
  }
`);

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
  collectionName: 'Posts' | 'Comments';
  metaInfo?: FeedPostMetaInfo | FeedCommentMetaInfo;
}

export const useSeeLess = ({ documentId, collectionName, metaInfo }: UseSeeLessOptions) => {
  const documentType = collectionName === 'Posts' ? 'post' : 'comment';
  const currentUser = useCurrentUser();
  const [isSeeLessMode, setIsSeeLessMode] = useState(false);
  const [seeLessEventId, setSeeLessEventId] = useState<string | null>(null);
  const [pendingFeedback, setPendingFeedback] = useState<FeedbackOptions | null>(null);
  const [createUltraFeedEvent] = useMutation(createUltraFeedEventMutation);
  const [updateUltraFeedEvent] = useMutation(updateUltraFeedEventMutation);
  const { captureEvent } = useTracking();
  
  const recommId = metaInfo && 'recommInfo' in metaInfo ? metaInfo.recommInfo?.recommId : undefined;

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
      void recombeeApi.createRating( documentId, currentUser._id, "neutral", recommId);
    }
    
    captureEvent("ultraFeedSeeLessUndone", {
      [`${documentType}Id`]: documentId,
      eventId: seeLessEventId,
    });
    
    setSeeLessEventId(null);
  }, [currentUser, seeLessEventId, documentId, documentType, recommId, updateUltraFeedEvent, captureEvent]);

  const handleSeeLessClick = useCallback(async () => {
    if (!currentUser) return;

    if (isSeeLessMode) {
      void handleUndoSeeLess();
      return;
    }

    setIsSeeLessMode(true);

    captureEvent("ultraFeedSeeLessClicked", {
      documentId,
      collectionName,
      sources: metaInfo?.sources,
      servedEventId: metaInfo?.servedEventId,
    });
    
    const eventData = {
      data: {
        userId: currentUser._id,
        eventType: 'seeLess' as const,
        documentId,
        collectionName,
        feedItemId: metaInfo?.servedEventId,
                  event: {
            feedbackReasons: {
              author: false,
              topic: false,
              contentType: false,
              repetitive: false,
              other: false,
              text: '',
            },
            sources: metaInfo?.sources,
            cancelled: false,
          }
      }
    };
    
    try {
      const result = await createUltraFeedEvent({ variables: eventData });
      const eventId = result.data?.createUltraFeedEvent?.data?._id;
      
      if (eventId) {
        setSeeLessEventId(eventId);
      }

      // Handle Recombee rating for posts
      if (collectionName === "Posts" && metaInfo && 'recommInfo' in metaInfo && recommId) {
        void recombeeApi.createRating(
          documentId, 
          currentUser._id, 
          "bigDownvote",
          recommId
        );
      }
    } catch (error) {
      //eslint-disable-next-line no-console
      console.error('Error creating see less event:', error);
      void handleUndoSeeLess();
    }
  }, [
    currentUser, 
    isSeeLessMode, 
    handleUndoSeeLess, 
    captureEvent, 
    documentId, 
    collectionName, 
    metaInfo, 
    createUltraFeedEvent,
    recommId
  ]);

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

  const handleFeedbackChange = useCallback((feedback: FeedbackOptions) => {
    // Don't send updates until we have a real event ID
    if (!seeLessEventId || seeLessEventId === 'pending') {
      setPendingFeedback(feedback);
      return;
    }
    
    void debouncedFeedbackUpdate(feedback);
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
    handleSeeLessClick,
    handleFeedbackChange,
  };
}; 
