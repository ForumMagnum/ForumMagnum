import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { useMutation } from 'react-apollo';
import { AnalyticsUtil } from '../../lib/analyticsEvents.js';
import { useCurrentUser } from './withUser.js';
import { useCookies } from 'react-cookie'
import gql from 'graphql-tag';
import withErrorBoundary from './withErrorBoundary';

export const AnalyticsClient = () => {
  const currentUser = useCurrentUser();
  const [cookies] = useCookies(['clientId']);
  
  const query = gql`
    mutation analyticsEventMutation($events: [JSON!]) {
      analyticsEvent(events: $events)
    }
  `;
  const [mutate] = useMutation(query);
  
  function flushEvents(events) {
    mutate({
      variables: {events}
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

registerComponent("AnalyticsClient", AnalyticsClient, withErrorBoundary);
