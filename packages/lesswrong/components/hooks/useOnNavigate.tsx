import { useEffect, useLayoutEffect } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { RouterLocation } from '../../lib/vulcan-lib/routes';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { useTracking } from '../../lib/analyticsEvents';

let lastLocation: RouterLocation|null = null;
type LocationChange = {oldLocation: RouterLocation|null, newLocation: RouterLocation};
let onNavigateFunctions: Array<(locationChange: LocationChange) => void> = [];

const NavigationEventSender = () => {
  const location = useSubscribedLocation();
  const { captureEvent } = useTracking();
  
  useLayoutEffect(() => {
    // Check if the path has actually changed
    if (location.pathname !== lastLocation?.pathname) {
      // Don't send the callback on the initial pageload, only on post-load navigations
      // Also suppress callbacks when (UltraFeed) modal just opened. UltraFeed modals change 
      // the location due to useDialogNavigation.tsx and would otherwise trigger here, closing the dialog as soon as it opens
      const suppressForDialogOpen = !!(window.history?.state?.dialogOpen);
      if (lastLocation && !suppressForDialogOpen) {
        captureEvent("navigate", {
          from: lastLocation.pathname,
          to: location.pathname,
        });
        let change: LocationChange = {oldLocation: lastLocation, newLocation: location};
        for(let cb of [...onNavigateFunctions]) {
          cb(change);
        }
      }
      lastLocation = {...location};
    }
  }, [location, captureEvent]);
  
  return null;
}

/**
 * Register a callback to be run when the user navigates the tab. This happens
 * at the *start* of the navigation, ie, when the link is first clicked (but
 * before most of the stuff at the destination has loaded).
 */
export function useOnNavigate(fn: (change: LocationChange) => void) {
  useEffect(() => {
    onNavigateFunctions.push(fn);
    return () => {
      onNavigateFunctions = onNavigateFunctions.filter(f=>f!==fn);
    };
  }, [fn]);
}

export default registerComponent("NavigationEventSender", NavigationEventSender);
