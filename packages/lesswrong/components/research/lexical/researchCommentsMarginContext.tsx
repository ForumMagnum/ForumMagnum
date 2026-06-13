'use client';

import React, { createContext, useContext, type ReactNode } from 'react';

/**
 * Host surface for the research document's inline-comments margin. Provided
 * by DocumentPane (which owns the scroll container and the layout), consumed
 * by ResearchCommentsMargin (which renders thread cards into the portal and
 * reports how many open threads exist so the document column can make room).
 */
export interface ResearchCommentsMarginHost {
  /**
   * Absolutely-positioned, zero-height element at the right edge of the
   * document scroll container; thread cards portal into it with absolute
   * `top` offsets in scroll-content coordinates.
   */
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
