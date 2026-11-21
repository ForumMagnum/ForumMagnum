"use client";
import React, { createContext, useLayoutEffect, useState } from "react";
import type { RouterLocation } from "./routeChecks/parseRoute";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/**
 * Holds the location for useSubscribedLocation. A context would rerender every
 * subscriber on any URL change, including query params that only one component
 * cares about (the search modal writes its query to the URL on every
 * keystroke), so subscribers select the part they read and rerender only when
 * that part changes.
 */
export interface LocationStore {
  get: () => RouterLocation,
  subscribe: (listener: () => void) => () => void,
  /**
   * Set during the provider's render, like the in-place updates of
   * LocationContext, so that components rendering below it in the same pass
   * (including ones mounting for a new route) read the new location.
   */
  set: (location: RouterLocation) => void,
  notify: () => void,
}

function createLocationStore(): LocationStore {
  let currentLocation: RouterLocation|null = null;
  const listeners = new Set<() => void>();
  return {
    get: () => currentLocation!,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    set: (location) => { currentLocation = location; },
    notify: () => {
      for (const listener of [...listeners]) {
        listener();
      }
    },
  };
}

/** Pass a new `location` object when the URL changes, and the same one otherwise. */
export const LocationStoreProvider = ({ location, children }: {
  location: RouterLocation,
  children: React.ReactNode,
}) => {
  const [store] = useState(createLocationStore);
  store.set(location);
  useLayoutEffect(() => store.notify(), [store, location]);
  return <SubscribeLocationContext.Provider value={store}>
    {children}
  </SubscribeLocationContext.Provider>;
}

export const LocationContext = createContext<RouterLocation|null>(null);
export const SubscribeLocationContext = createContext<LocationStore|null>(null);
export const NavigationContext = createContext<{ history: AppRouterInstance }|null>(null);
