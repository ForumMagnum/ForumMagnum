import { useEffectEvent, useLayoutEffect } from 'react';
import { useLocationStore } from '@/lib/routeUtil';

/** Reset transient UI on URL changes and when Activity hides or restores a page. */
export function useOnNavigateOrHide(reset: () => void) {
  // Subscribes to the store instead of rendering on URL changes, because every
  // hover target uses this and the URL can change on every keystroke.
  const locationStore = useLocationStore();
  const resetState = useEffectEvent(reset);

  useLayoutEffect(() => {
    // Reset on restoration too: updates scheduled while an Activity is hidden
    // can be deferred. The restored page should paint with its transient UI closed.
    resetState();
    // Only ClientAppGenerator provides the store, so emails have none
    if (!locationStore) return () => resetState();
    let url = locationStore.get().url;
    const unsubscribe = locationStore.subscribe(() => {
      const newUrl = locationStore.get().url;
      if (newUrl === url) return;
      url = newUrl;
      resetState();
    });
    return () => {
      unsubscribe();
      resetState();
    };
  }, [locationStore]);
}
