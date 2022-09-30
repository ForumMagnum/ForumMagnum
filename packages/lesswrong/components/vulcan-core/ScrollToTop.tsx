import {useEffect, useRef} from 'react';
import {registerComponent} from '../../lib/vulcan-lib';
import { useSubscribedLocation } from '../../lib/routeUtil';

// Scroll restoration based on https://reacttraining.com/react-router/web/guides/scroll-restoration.
export default function ScrollToTop() {
  const { pathname, currentRoute } = useSubscribedLocation();
  const didMountRef = useRef(false)
  
  useEffect(() => {
    if (didMountRef.current) {
      if (currentRoute?.initialScroll == "bottom") {
        window.scrollTo(0, document.body.scrollHeight);
      } else {
        window.scrollTo(0, 0);
      }
    } else didMountRef.current = true
  }, [pathname, currentRoute?.initialScroll])

  return null;
}

const ScrollToTopComponent = registerComponent('ScrollToTop', ScrollToTop);

declare global {
  interface ComponentTypes {
    ScrollToTop: typeof ScrollToTopComponent
  }
}
