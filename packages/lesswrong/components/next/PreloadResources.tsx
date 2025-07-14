'use client';

import ReactDOM from "react-dom";

export function PreloadResources({ preloadStyleUrls }: { preloadStyleUrls: string[] }) {
  for (const url of preloadStyleUrls) {
    ReactDOM.preload(url, { as: 'style', fetchPriority: 'high' });
  }

  return null;
}
