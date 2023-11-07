import {useEffect, useRef} from 'react';
import {registerComponent} from '../../lib/vulcan-lib';
import { useSubscribedLocation } from '../../lib/routeUtil';

// Scroll restoration based on https://reacttraining.com/react-router/web/guides/scroll-restoration.
export default function ScrollToTop() {
  const location = useSubscribedLocation();
  const { pathname, query, currentRoute } = location;
  const isNotFirstMountRef = useRef(false)
  
  // Stringify `query` to guarantee referential stability for the useEffect dependency
  const queryAsStr = JSON.stringify(query);
  
  useEffect(() => {
    // Skip scrolling to the top the first time this useEffect runs, because that's
    // the initial pageload, for which the browser is choosing a scroll position
    // based on its own (mostly sensible) heuristics. But scroll when any of the
    // dependencies of this useEffect change, because those are client-side
    // navigations, which the browser won't handle.
    if (isNotFirstMountRef.current) {
      if (currentRoute?.initialScroll == "bottom") {
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
