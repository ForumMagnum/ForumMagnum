'use client';

import React, { createContext, Suspense, useContext } from 'react';

/**
 * If set, suspense boundaries will have corresponding context providers with
 * their names, and useQuery will console.log each time it renders with the
 * query name and suspense-boundary path, so you can identify which queries are
 * causing which boundaries to be suspended.
 */
export const debugSuspenseBoundaries = false;

export const NamedSuspenseBoundary = createContext<string|null>(null);

/**
 * Identical to React's <Suspense>, except that it also takes a name that can
 * be used to identify this Suspense boundary in debug logs, and may log debug
 * information related to waterfalling.
 */
export const SuspenseWrapper = debugSuspenseBoundaries
  ? ({name, fallback, children}: {
      name: string
      fallback?: React.ReactNode
      children: React.ReactNode
    }) => {
      const parentSuspenseBoundary = useContext(NamedSuspenseBoundary) ?? `root`;
      const boundaryName = parentSuspenseBoundary ? `${parentSuspenseBoundary}/${name}` : name;
  
      // eslint-disable-next-line no-console
      console.log(`Started suspense group: ${boundaryName}`);
  
      return <NamedSuspenseBoundary value={boundaryName}>
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      </NamedSuspenseBoundary>
    }
  : Suspense
