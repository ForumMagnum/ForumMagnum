/**
 * Type stub for React's Activity API.
 * 
 * React 19.2.0 stable types declare `Activity` as an export, but at runtime it may not be 
 * available yet. This stub adds the `unstable_Activity` export which is used as a fallback
 * in PersistentHomepage.tsx.
 * 
 * This file can be removed once React officially stabilizes the Activity API and it's
 * consistently available in all React 19.x runtimes.
 */
import type * as React from 'react';

declare module 'react' {
  export interface ActivityProps {
    children?: React.ReactNode;
    mode?: 'visible' | 'hidden';
  }

  export const unstable_Activity: React.ComponentType<ActivityProps> | undefined;
}


