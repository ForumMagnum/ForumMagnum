'use client';

import React, { createContext, useContext, useRef, useEffect } from 'react';
import { useNavigationCount } from '../next/ClientAppGenerator';

const NavigationTooltipContainerContext = createContext<HTMLDivElement | null>(null);

export const useNavigationTooltipContainer = () => {
  return useContext(NavigationTooltipContainerContext);
};

/**
 * Provides a container div that gets remounted on navigation.
 * Tooltips can portal into this container, and they'll be automatically
 * cleaned up when navigation occurs (because the container unmounts).
 * 
 * This solves the problem of tooltips persisting when navigating away from
 * a page that's using the Activity API to preserve state.
 */
const NavigationTooltipContainer = ({ children }: { children: React.ReactNode }) => {
  const navigationCount = useNavigationCount();
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <NavigationTooltipContainerContext.Provider value={containerRef.current}>
      {/* Key on navigationCount to force remount on navigation */}
      <div
        key={navigationCount}
        ref={containerRef}
        id="navigation-tooltip-container"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 0,
          height: 0,
          overflow: 'visible',
          pointerEvents: 'none',
        }}
      />
      {children}
    </NavigationTooltipContainerContext.Provider>
  );
};

export default NavigationTooltipContainer;
