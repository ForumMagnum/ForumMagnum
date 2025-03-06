import {useEffect, useRef} from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSubscribedLocation } from '../../lib/routeUtil';
import { isLWorAF } from '@/lib/instanceSettings';
import stringify from 'json-stringify-deterministic';

// Scroll restoration based on https://reacttraining.com/react-router/web/guides/scroll-restoration.
export default function ScrollToTop() {
  const location = useSubscribedLocation();
  const { pathname, query, currentRoute } = location;
  const isNotFirstMountRef = useRef(false)
  
  // Re-scrolling to top when the query needs to be worked around in a lot of cases
  // (e.g. when trying to use a query param to control a simple piece of state).
  // I have disabled this for EAF because I think not-scrolling is a better default, and
  // specifically to support in-context comments. This will cause some subtle behavior differences
  // between EAF and other forums (e.g. changing filters on the allPosts page won't re-scroll to top)
  const queryAsStr = isLWorAF && stringify(query);
  
  useEffect(() => {
    // Skip scrolling to the top the first time this useEffect runs, because that's
    // the initial pageload, for which the browser is choosing a scroll position
    // based on its own (mostly sensible) heuristics. But scroll when any of the
    // dependencies of this useEffect change, because those are client-side
    // navigations, which the browser won't handle.
    if (isNotFirstMountRef.current) {
      if (currentRoute?.initialScroll === "bottom") {
        window.scrollTo(0, document.body.scrollHeight);
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      isNotFirstMountRef.current = true
    }
  }, [pathname, queryAsStr, currentRoute?.initialScroll])

  return null;
}

const ScrollToTopComponent = registerComponent('ScrollToTop', ScrollToTop);

declare global {
  interface ComponentTypes {
    ScrollToTop: typeof ScrollToTopComponent
  }
}
