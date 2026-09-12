import { useEffectEvent, useLayoutEffect } from 'react';
import { useSubscribedLocation } from '@/lib/routeUtil';

/** Reset transient UI on URL changes and when Activity hides or restores a page. */
export function useOnNavigateOrHide(reset: () => void) {
  const location = useSubscribedLocation();
  const resetState = useEffectEvent(reset);

  useLayoutEffect(() => {
    // Reset on restoration too: updates scheduled while an Activity is hidden
    // can be deferred. The restored page should paint with its transient UI closed.
    resetState();
    return () => resetState();
  }, [location?.url]);
}
