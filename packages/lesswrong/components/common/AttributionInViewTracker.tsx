import { registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect, useCallback, useRef } from 'react';
import { useIsInView } from "../../lib/analyticsEvents";
import { useCurrentUser } from './withUser';
import { RecombeeViewPortionProps, recombeeApi } from '../../lib/recombee/client';
import { recombeeEnabledSetting, vertexEnabledSetting } from '../../lib/publicSettings';
import { gql } from '@apollo/client';
import { isRecombeeRecommendablePost } from '@/lib/collections/posts/helpers';
import { useClientId } from '@/lib/abTestImpl';
import { useMutate } from '../hooks/useMutate';

interface AttributionEventProps {
  post: PostsListBase;
  portion: number;
  recommId?: string;
  vertexAttributionId?: string;
}

const AttributionInViewTracker = ({eventProps, observerProps, children}: {
  eventProps: AttributionEventProps,
  observerProps?: Record<string,any>,
  children?: React.ReactNode
}) => {
  const { setNode, entry } = useIsInView(observerProps);
  const alreadySent = useRef(false);
  const currentUser = useCurrentUser();
  const clientId = useClientId();

  const sendRecombeeViewPortionEvent = useCallback(
    (eventProps: RecombeeViewPortionProps) => recombeeApi.createViewPortion(eventProps),
  []);

  const {mutate} = useMutate();

  useEffect(() => {
    const attributedUserId = currentUser?._id ?? clientId;
    if (!!entry && attributedUserId) {
      const { isIntersecting, intersectionRatio } = entry;
      if (!alreadySent.current && isIntersecting && intersectionRatio > 0) {
        if (recombeeEnabledSetting.get()) {
          const { vertexAttributionId, post, ...recombeeEventProps } = eventProps;
          if (isRecombeeRecommendablePost(post)) {
            const postId = post._id;
            void sendRecombeeViewPortionEvent({ ...recombeeEventProps, postId, timestamp: new Date(), userId: attributedUserId });
          }
          
          alreadySent.current = true;
        }

        if (currentUser && vertexEnabledSetting.get()) {
          const { post: { _id: postId }, vertexAttributionId } = eventProps;
          void mutate({
            mutation: gql`
              mutation sendVertexMediaCompleteEventMutation($postId: String!, $attributionId: String) {
                sendVertexMediaCompleteEvent(postId: $postId, attributionId: $attributionId)
              }
            `,
            variables: { postId, attributionId: vertexAttributionId },
            errorHandling: "loggedAndSilent",
          });
          alreadySent.current = true;
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, sendRecombeeViewPortionEvent, mutate]);

  return (
    <span ref={setNode}>
      { children }
    </span>
  )
}

const AttributionInViewTrackerComponent = registerComponent('AttributionInViewTracker', AttributionInViewTracker)

declare global {
  interface ComponentTypes {
    AttributionInViewTracker: typeof AttributionInViewTrackerComponent
  }
}
