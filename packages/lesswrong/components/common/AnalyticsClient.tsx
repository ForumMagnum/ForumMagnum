import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useMutation } from 'react-apollo';
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
  
  function flushEvents(events) {
    void mutate({
      variables: {
        events,
        now: new Date(),
      }
    });
  }
 
  React.useEffect(() => {
    AnalyticsUtil.clientWriteEvents = flushEvents;
    AnalyticsUtil.clientContextVars.userId = currentUser?._id;
    AnalyticsUtil.clientContextVars.clientId = cookies.clientId;
    
    return function cleanup() {
      AnalyticsUtil.clientWriteEvents = null;
    }
  });
  
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
