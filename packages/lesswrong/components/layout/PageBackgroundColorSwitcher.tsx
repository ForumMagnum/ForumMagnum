"use client";
import React, { useEffect } from 'react';
import { usePrerenderablePathname } from '../next/usePrerenderablePathname';
import { routeHasWhiteBackground } from './routeBackgroundColors';

export function PageBackgroundColorSwitcher() {
  // Some pages (eg post pages) have a solid white background, others (eg front page) have a gray
  // background against which individual elements in the central column provide their own
  // background. (In dark mode this is black and dark gray instead of white and light gray). This
  // is handled by putting `classes.whiteBackground` onto the main wrapper.
  //
  // But, caveat/hack: If the page has horizontal scrolling and the horizontal scrolling is the
  // result of a floating window, the page wrapper doesn't extend far enough to the right. So we
  // also have a `useEffect` which adds a class to `<body>`. (This has to be a useEffect because
  // <body> is outside the React tree entirely. An alternative way to do this would be to change
  // overflow properties so that `<body>` isn't scrollable but a `<div>` in here is.)
  const pathname = usePrerenderablePathname();
  const useWhiteBackground = routeHasWhiteBackground(pathname);

  useEffect(() => {
    const isWhite = document.body.classList.contains("whiteBackground");
    if (isWhite !== useWhiteBackground) {
      if (useWhiteBackground) {
        document.body.classList.add("whiteBackground");
        document.body.classList.remove("greyBackground");
      } else {
        document.body.classList.remove("whiteBackground");
        document.body.classList.add("greyBackground");
      }
    }
  }, [useWhiteBackground]);
  
  return null;
}

export default PageBackgroundColorSwitcher;
