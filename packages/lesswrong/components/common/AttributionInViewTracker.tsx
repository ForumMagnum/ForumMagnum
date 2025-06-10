import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useEffect, useCallback, useState } from 'react';
import { useIsInView } from "../../lib/analyticsEvents";
import { useCurrentUser } from './withUser';
import { RecombeeViewPortionProps, recombeeApi } from '../../lib/recombee/client';
import { recombeeEnabledSetting, vertexEnabledSetting } from '../../lib/publicSettings';
import { useMutation } from '@apollo/client';
import { isRecombeeRecommendablePost } from '@/lib/collections/posts/helpers';
import { useClientId } from '@/lib/abTestImpl';
import { gql } from "@/lib/generated/gql-codegen";
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
  const [alreadySent, setAlreadySent] = useState(false);
  const currentUser = useCurrentUser();
  const clientId = useClientId();

  const sendRecombeeViewPortionEvent = useCallback(
    (eventProps: RecombeeViewPortionProps) => recombeeApi.createViewPortion(eventProps),
  []);

  const [sendVertexMediaCompleteEvent] = useMutation(gql(`
    mutation sendVertexMediaCompleteEventMutation($postId: String!, $attributionId: String) {
      sendVertexMediaCompleteEvent(postId: $postId, attributionId: $attributionId)
    }
  `), {
    ignoreResults: true
  });

  useEffect(() => {
    const attributedUserId = currentUser?._id ?? clientId;
    if (!!entry && attributedUserId) {
      const { isIntersecting, intersectionRatio } = entry;
      if (!alreadySent && isIntersecting && intersectionRatio > 0) {
        if (recombeeEnabledSetting.get()) {
          const { vertexAttributionId, post, ...recombeeEventProps } = eventProps;
          if (isRecombeeRecommendablePost(post)) {
            const postId = post._id;
            void sendRecombeeViewPortionEvent({ ...recombeeEventProps, postId, timestamp: new Date(), userId: attributedUserId });
          }
          
          setAlreadySent(true);
        }

        if (currentUser && vertexEnabledSetting.get()) {
          const { post: { _id: postId }, vertexAttributionId } = eventProps;
          void sendVertexMediaCompleteEvent({ variables: { postId, attributionId: vertexAttributionId ?? null } });
          setAlreadySent(true);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry, sendRecombeeViewPortionEvent, sendVertexMediaCompleteEvent, alreadySent]);

  return (
    <span ref={setNode}>
      { children }
    </span>
  )
}

export default registerComponent('AttributionInViewTracker', AttributionInViewTracker);


