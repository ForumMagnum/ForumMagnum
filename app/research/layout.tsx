import React from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

/**
 * Provides the Geist font-family CSS variables (--font-geist-sans /
 * --font-geist-mono) to every /research route. The research style tokens
 * (researchUiSans / researchMono in researchStyleUtils.ts) reference these
 * variables with non-Geist fallbacks, so the fonts only apply where the
 * variables are in scope — the rest of the site is unaffected.
 * display:contents keeps the wrapper out of the layout/height chain.
 */
export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${GeistSans.variable} ${GeistMono.variable}`} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
