import React, {useCallback, useEffect} from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useMutation, gql } from '@apollo/client';
import { AnalyticsUtil } from '../../lib/analyticsEvents';
import { useCurrentUser } from './withUser';
import { useCookies } from 'react-cookie'
import withErrorBoundary from './withErrorBoundary';

export const AnalyticsClient = () => {
  const currentUser = useCurrentUser();
  const [cookies] = useCookies(['clientId']);
  
  // We do this with a direct POST request rather than going through graphql
  // because this type of request is voluminous enough and different enough
  // from other requests that we want its error handling to be different, and
  // potentially want it to be a special case at the load balancer.
  const flushEvents = useCallback(async (events) => {
    await fetch("/analyticsEvent", {
      method: "POST",
      body: JSON.stringify({
        events, now: new Date(),
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }, []);
 
  const currentUserId = currentUser?._id;
  const clientId = cookies.clientId;
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
