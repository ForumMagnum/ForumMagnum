import React, {useCallback, useEffect} from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useMutation } from '@apollo/client';
import { AnalyticsUtil } from '../../lib/analyticsEvents';
import { useCurrentUser } from './withUser';
import { useCookies } from 'react-cookie'
import gql from 'graphql-tag';
import withErrorBoundary from './withErrorBoundary';

export const AnalyticsClient = () => {
  const currentUser = useCurrentUser();
  const [cookies] = useCookies(['clientId']);
  
  const query = gql`
    mutation analyticsEventMutation($events: [JSON!], $now: Date) {
      analyticsEvent(events: $events, now: $now)
    }
  `;
  const [mutate] = useMutation(query, {
    ignoreResults: true
  });
  
  const flushEvents = useCallback((events) => {
    void mutate({
      variables: {
        events,
        now: new Date(),
      }
    });
  }, [mutate]);
 
  const currentUserId = currentUser?._id;
  const clientId = cookies.cilentId;
  useEffect(() => {
    AnalyticsUtil.clientWriteEvents = flushEvents;
    AnalyticsUtil.clientContextVars.userId = currentUserId;
    AnalyticsUtil.clientContextVars.clientId = clientId;
    
    return function cleanup() {
      AnalyticsUtil.clientWriteEvents = null;
    }
  }, [flushEvents, currentUserId, clientId]);
  
  return <div/>;
}

const AnalyticsClientComponent = registerComponent("AnalyticsClient", AnalyticsClient, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    AnalyticsClient: typeof AnalyticsClientComponent
  }
}
