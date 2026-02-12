'use client';
import React, { createContext, useContext, useMemo, useRef, useState } from 'react';

interface SubtitlePortalContextValue {
  containerRef: React.RefObject<HTMLSpanElement|null>;
  hasSubtitleContent: boolean;
  setHasSubtitleContent: (hasContent: boolean) => void;
}

const SubtitlePortalContext = createContext<SubtitlePortalContextValue|null>(null);

export const SubtitlePortalProvider = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLSpanElement|null>(null);
  const [hasSubtitleContent, setHasSubtitleContent] = useState(false);

  const value = useMemo(() => ({
    containerRef,
    hasSubtitleContent,
    setHasSubtitleContent,
  }), [hasSubtitleContent, setHasSubtitleContent]);

  return <SubtitlePortalContext.Provider value={value}>
    {children}
  </SubtitlePortalContext.Provider>
};

export const useSubtitlePortal = () => {
  const context = useContext(SubtitlePortalContext);
  if (!context) {
    throw new Error('useSubtitlePortal must be used within a SubtitlePortalProvider');
  }
  return context;
};
