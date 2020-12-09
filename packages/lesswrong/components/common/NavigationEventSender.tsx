import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { CallbackChainHook  } from '../../lib/vulcan-lib/callbacks';
import type { RouterLocation } from '../../lib/vulcan-lib/routes';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { isClient } from '../../lib/executionEnvironment';
import * as _ from 'underscore';

let lastLocation: RouterLocation|null = null;

export const routerOnUpdate = new CallbackChainHook<{oldLocation:RouterLocation|null,newLocation:RouterLocation},[]>("router.onUpdate");

const NavigationEventSender = () => {
  const location = useSubscribedLocation();
  
  React.useEffect(() => {
    // Only handle navigation events on the client (they don't apply to SSR)
    if (isClient) {
      // Check if the path has actually changed
      if (location.pathname !== lastLocation?.pathname) {
        // Don't send the callback on the initial pageload, only on post-load navigations
        if (lastLocation) {
          void routerOnUpdate.runCallbacks({
            iterator: {oldLocation: lastLocation, newLocation: location},
            properties: [],
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
