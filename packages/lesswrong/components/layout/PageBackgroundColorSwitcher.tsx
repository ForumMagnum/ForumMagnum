"use client";
import React, { useEffect } from 'react';
import { usePrerenderablePathname } from '../next/usePrerenderablePathname';
import { routeHasWhiteBackground, routeHasCreamBackground } from '@/lib/routeChecks/routeBackgroundColors';

const bgClasses = ["whiteBackground", "greyBackground", "creamBackground"] as const;

function getBodyBackgroundClass(pathname: string): typeof bgClasses[number] {
  if (routeHasCreamBackground(pathname)) return "creamBackground";
  if (routeHasWhiteBackground(pathname)) return "whiteBackground";
  return "greyBackground";
}

export function PageBackgroundColorSwitcher() {
  // Some pages (eg post pages) have a solid white background, others (eg front page) have a gray
  // background against which individual elements in the central column provide their own
  // background. A third tier, "cream", is used for pages with a warm off-white background
  // (eg, the profile page). In dark mode the colors are black, dark gray, and dark gray
  // respectively.
  //
  // But, caveat/hack: If the page has horizontal scrolling and the horizontal scrolling is the
  // result of a floating window, the page wrapper doesn't extend far enough to the right. So we
  // also have a `useEffect` which adds a class to `<body>`. (This has to be a useEffect because
  // <body> is outside the React tree entirely. An alternative way to do this would be to change
  // overflow properties so that `<body>` isn't scrollable but a `<div>` in here is.)
  const pathname = usePrerenderablePathname();
  const targetClass = getBodyBackgroundClass(pathname);

  useEffect(() => {
    for (const cls of bgClasses) {
      if (cls === targetClass) {
        document.body.classList.add(cls);
      } else {
        document.body.classList.remove(cls);
      }
    }
  }, [targetClass]);
  
  return null;
}

export default PageBackgroundColorSwitcher;
