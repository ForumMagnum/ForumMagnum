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
export class LocationStore {
  private location: RouterLocation|null = null;
  private listeners = new Set<() => void>();

  get = (): RouterLocation => this.location!;

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  /**
   * Set during the provider's render, like the in-place updates of
   * LocationContext, so that components rendering below it in the same pass
   * (including ones mounting for a new route) read the new location.
   */
  set(location: RouterLocation) {
    this.location = location;
  }

  notify() {
    for (const listener of [...this.listeners]) {
      listener();
    }
  }
}

/** Pass a new `location` object when the URL changes, and the same one otherwise. */
export const LocationStoreProvider = ({ location, children }: {
  location: RouterLocation,
  children: React.ReactNode,
}) => {
  const [store] = useState(() => new LocationStore());
  store.set(location);
  useLayoutEffect(() => store.notify(), [store, location]);
  return <SubscribeLocationContext.Provider value={store}>
    {children}
  </SubscribeLocationContext.Provider>;
}

export const LocationContext = createContext<RouterLocation|null>(null);
export const SubscribeLocationContext = createContext<LocationStore|null>(null);
export const NavigationContext = createContext<{ history: AppRouterInstance }|null>(null);
