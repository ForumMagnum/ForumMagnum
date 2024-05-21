import { registerComponent } from '../../lib/vulcan-lib';
import React, { useEffect, useCallback, useState } from 'react';
import { useIsInView } from "../../lib/analyticsEvents";
import { useCurrentUser } from './withUser';
import { RecombeeViewPortionProps, recombeeApi } from '../../lib/recombee/client';
import { recombeeEnabledSetting, vertexEnabledSetting } from '../../lib/publicSettings';
import { gql, useMutation } from '@apollo/client';

interface AttributionEventProps extends Omit<RecombeeViewPortionProps, 'timestamp'|'userId'> {
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

  const sendRecombeeViewPortionEvent = useCallback(
    (eventProps: RecombeeViewPortionProps) => recombeeApi.createViewPortion(eventProps),
  []);

  const [sendVertexMediaCompleteEvent] = useMutation(gql`
    mutation sendVertexMediaCompleteEventMutation($postId: String!, $attributionId: String) {
      sendVertexMediaCompleteEvent(postId: $postId, attributionId: $attributionId)
    }
  `, {
    ignoreResults: true
  });

  useEffect(() => {
    if (!!entry && !!currentUser) {
      const { isIntersecting, intersectionRatio } = entry;
      if (!alreadySent && isIntersecting && intersectionRatio > 0) {
        if (recombeeEnabledSetting.get()) {
          const { vertexAttributionId, ...recombeeEventProps } = eventProps;
          void sendRecombeeViewPortionEvent({ ...recombeeEventProps, timestamp: new Date(), userId: currentUser._id });
          setAlreadySent(true);
        }

        if (vertexEnabledSetting.get()) {
          const { postId, vertexAttributionId } = eventProps;
          void sendVertexMediaCompleteEvent({ variables: { postId, attributionId: vertexAttributionId } });
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

const AttributionInViewTrackerComponent = registerComponent('AttributionInViewTracker', AttributionInViewTracker)

declare global {
  interface ComponentTypes {
    AttributionInViewTracker: typeof AttributionInViewTrackerComponent
  }
}
