import { useEffect } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { CallbackChainHook  } from '../../lib/vulcan-lib/callbacks';
import type { RouterLocation } from '../../lib/vulcan-lib/routes';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { isClient } from '../../lib/executionEnvironment';
import { captureEvent } from '../../lib/analyticsEvents';
import * as _ from 'underscore';

let lastLocation: RouterLocation|null = null;

const routerOnUpdate = new CallbackChainHook<{oldLocation:RouterLocation|null,newLocation:RouterLocation},[]>("router.onUpdate");

const NavigationEventSender = () => {
  const location = useSubscribedLocation();
  
  useEffect(() => {
    // Only handle navigation events on the client (they don't apply to SSR)
    if (isClient) {
      // Check if the path has actually changed
      if (location.pathname !== lastLocation?.pathname) {
        // Don't send the callback on the initial pageload, only on post-load navigations
        if (lastLocation) {
          captureEvent("navigate", {
            from: lastLocation.pathname,
            to: location.pathname,
          });
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

/**
 * Register a callback to be run when the user navigates the tab. This happens
 * at the *start* of the navigation, ie, when the link is first clicked (but
 * before most of the stuff at the destination has loaded).
 */
export function useOnNavigate(fn: ({oldLocation,newLocation}: {oldLocation: RouterLocation|null, newLocation: RouterLocation})=>void) {
  useEffect(() => {
    routerOnUpdate.add(fn);
    return () => {
      routerOnUpdate.remove(fn);
    };
  }, [fn]);
}

const NavigationEventSenderComponent = registerComponent("NavigationEventSender", NavigationEventSender);

declare global {
  interface ComponentTypes {
    NavigationEventSender: typeof NavigationEventSenderComponent
  }
}
