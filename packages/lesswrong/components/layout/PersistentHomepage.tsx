'use client';

import React, { ReactNode, useEffect, useState, createContext, useContext, Activity as ActivityExport } from 'react';
import { useLocation } from '@/lib/routeUtil';
import LWHome from '../common/LWHome';

// Context to mark when the UltraFeed has been viewed (scrolled into view)
const UltraFeedViewedContext = createContext<(() => void) | null>(null);

export const useMarkUltraFeedAsViewed = () => {
  return useContext(UltraFeedViewedContext);
};

// Activity might not be available at runtime even though types declare it
// Try multiple fallbacks: stable Activity -> unstable_Activity -> Symbol fallback
// TODO: Fix all this, issues because Activity not being properly available
const Activity = (
  ActivityExport ?? 
  (React as any).unstable_Activity ?? 
  (Symbol.for('react.activity') as any)
) as React.ComponentType<{ children?: ReactNode; mode?: 'visible' | 'hidden' }>;

/**
 * Uses React's Activity API to persist the homepage (LWHome) when navigating away and back.
 * Triggers when the UltraFeed has been viewed (scrolled into view) and homepage has been visited.
 * This means you can navigate away from the feed and come back to it with all your state intact.
 */
const PersistentHomepage = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const onHomepage = pathname === '/';
  
  const [hasVisitedHomepage, setHasVisitedHomepage] = useState(onHomepage);
  const [hasViewedUltraFeed, setHasViewedUltraFeed] = useState(false);
  
  useEffect(() => {
    if (onHomepage && !hasVisitedHomepage) {
      setHasVisitedHomepage(true);
    }
  }, [onHomepage, hasVisitedHomepage]);
  
  // Log Activity mode changes
  useEffect(() => {
    if (hasVisitedHomepage && hasViewedUltraFeed) {
      console.log(
        '[PersistentHomepage] Activity mode:', onHomepage ? 'visible' : 'hidden',
        {pathname: pathname, hasViewedUltraFeed: hasViewedUltraFeed}
      );
    }
  }, [onHomepage, pathname, hasVisitedHomepage, hasViewedUltraFeed]);
  
  const markUltraFeedAsViewed = () => {
    if (!hasViewedUltraFeed) {
      setHasViewedUltraFeed(true);
    }
  };
  
  const shouldPersist = hasVisitedHomepage && hasViewedUltraFeed;
  
  /* We always use the Activity API when on the homepage, 
  * and only use it off the homepage if the conditions
  * (homepage and UltraFeed viewed) are met. 
  */
  
  return (
    <UltraFeedViewedContext.Provider value={markUltraFeedAsViewed}>
      {(onHomepage || shouldPersist) && (
        <>
          <Activity mode={onHomepage ? 'visible' : 'hidden'}>
            <LWHome />
          </Activity>
          {!onHomepage && children}
        </>
      )}
      {!onHomepage && !shouldPersist && children}
    </UltraFeedViewedContext.Provider>
  );
};

export default PersistentHomepage;
