import React, {useEffect} from 'react';
import {registerComponent} from '../../lib/vulcan-lib';
import { useSubscribedLocation } from '../../lib/routeUtil';

// Scroll restoration based on https://reacttraining.com/react-router/web/guides/scroll-restoration.
export default function ScrollToTop() {
  const { pathname } = useSubscribedLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

const ScrollToTopComponent = registerComponent('ScrollToTop', ScrollToTop);

declare global {
  interface ComponentTypes {
    ScrollToTop: typeof ScrollToTopComponent
  }
}
