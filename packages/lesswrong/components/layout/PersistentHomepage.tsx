'use client';

import React, { ReactNode, useEffect, useState, createContext, useContext, useCallback, useMemo, Activity } from 'react';
import { useLocation } from '@/lib/routeUtil';
import { forumSelect } from '@/lib/forumTypeUtils';
import LWHome from '../common/LWHome';
import EAHome from '../ea-forum/EAHome';
import AlignmentForumHome from '../alignment-forum/AlignmentForumHome';

// Context to mark when the UltraFeed has been viewed (scrolled into view)
const UltraFeedViewedContext = createContext<(() => void) | null>(null);

export const useMarkUltraFeedAsViewed = () => {
  return useContext(UltraFeedViewedContext);
};

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
  
  const markUltraFeedAsViewed = useCallback(() => {
    if (!hasViewedUltraFeed) {
      setHasViewedUltraFeed(true);
    }
  }, [hasViewedUltraFeed]);
  
  const shouldPersist = hasVisitedHomepage && hasViewedUltraFeed;
  
  /* We always use the Activity API when on the homepage, 
  * and only use it off the homepage if the conditions
  * (homepage and UltraFeed viewed) are met. 
  */
  
  return (
    <UltraFeedViewedContext.Provider value={markUltraFeedAsViewed}>
      <Activity mode="visible">
        {children}
      </Activity>
      <Activity mode={onHomepage ? 'visible' : 'hidden'}>
        {hasVisitedHomepage && forumSelect({
          AlignmentForum: <AlignmentForumHome/>,
          LessWrong: <LWHome/>,
          EAForum: <EAHome/>,
          default: <LWHome/>,
        })}
      </Activity>
    </UltraFeedViewedContext.Provider>
  );
};

export default PersistentHomepage;
