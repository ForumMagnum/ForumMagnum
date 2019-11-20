import React from 'react';
import { registerComponent, runCallbacks } from 'meteor/vulcan:core';
import { useLocation } from '../../lib/routeUtil';

let lastLocation = null;

const NavigationEventSender = () => {
  const location = useLocation();
  
  React.useEffect(() => {
    // Only handle navigation events on the client (they don't apply to SSR)
    if (Meteor.isClient) {
      // Check if the path has actually changed
      if (location.pathname !== lastLocation?.pathname) {
        // Don't send the callback on the initial pageload, only on post-load navigations
        if (lastLocation) {
          runCallbacks('router.onUpdate', {oldLocation: lastLocation, newLocation: location});
        }
        lastLocation = _.clone(location);
      }
    }
  }, [location]);
  
  return null;
}

registerComponent("NavigationEventSender", NavigationEventSender);
