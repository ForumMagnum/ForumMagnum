import React from 'react';
import { registerComponent, runCallbacks } from '../../lib/vulcan-lib';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { isClient } from '../../lib/executionEnvironment';
import * as _ from 'underscore';

let lastLocation: any = null;

const NavigationEventSender = () => {
  const location = useSubscribedLocation();
  
  React.useEffect(() => {
    // Only handle navigation events on the client (they don't apply to SSR)
    if (isClient) {
      // Check if the path has actually changed
      if (location.pathname !== lastLocation?.pathname) {
        // Don't send the callback on the initial pageload, only on post-load navigations
        if (lastLocation) {
          runCallbacks({
            name: 'router.onUpdate',
            iterator: {oldLocation: lastLocation, newLocation: location}
          });
        }
        lastLocation = _.clone(location);
      }
    }
  }, [location]);
  
  return null;
}

const NavigationEventSenderComponent = registerComponent("NavigationEventSender", NavigationEventSender);

declare global {
  interface ComponentTypes {
    NavigationEventSender: typeof NavigationEventSenderComponent
  }
}
