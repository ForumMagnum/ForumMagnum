'use client';

import React, { createContext, useContext, type ReactNode } from 'react';

export interface ResearchCommentsMarginHost {
  portalContainer: HTMLElement | null;
  setOpenThreadCount: (count: number) => void;
}

const ResearchCommentsMarginContext = createContext<ResearchCommentsMarginHost | null>(null);

export function ResearchCommentsMarginHostProvider({
  value,
  children,
}: {
  value: ResearchCommentsMarginHost;
  children: ReactNode;
}) {
  return (
    <ResearchCommentsMarginContext.Provider value={value}>
      {children}
    </ResearchCommentsMarginContext.Provider>
  );
}

export function useResearchCommentsMarginHostOptional(): ResearchCommentsMarginHost | null {
  return useContext(ResearchCommentsMarginContext);
}
