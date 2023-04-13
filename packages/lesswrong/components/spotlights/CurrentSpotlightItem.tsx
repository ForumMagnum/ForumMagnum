import moment from 'moment';
import React, { useCallback } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { registerCookie } from '../../lib/cookies/utils';
import { useHideWithCookie } from '../hooks/useHideWithCookie';

const HIDE_SPOTLIGHT_ITEM_PREFIX = 'hide_spotlight_item_';
const HIDDEN_SPOTLIGHT_ITEMS = registerCookie({
  name: "hidden_spotlight_items",
  type: "functional",
  description: "TODO",
});

export const CurrentSpotlightItem = ({classes}: {
  classes: ClassesType,
}) => {
  const { SpotlightItem } = Components
  const { captureEvent } = useTracking()  

  const { results: [spotlight] = [] } = useMulti({
    collectionName: 'Spotlights',
    fragmentName: 'SpotlightDisplay',
    terms: {
      view: 'mostRecentlyPromotedSpotlights',
      limit: 1
    }
  });

  // TODO migrate old values to new cookie
  // const cookieName = useMemo(() => `${HIDE_SPOTLIGHT_ITEM_PREFIX}${spotlight?.document._id}`, [spotlight]); //hiding in one place, hides everywhere
  // const [cookies, setCookie] = useCookies([cookieName]);

  // const isHidden = useMemo(() => !!cookies[cookieName], [cookies, cookieName]);

  // const hideBanner = useCallback(() => {
  //   setCookie(
  //     cookieName,
  //     "true", {
  //       expires: moment().add(30, 'days').toDate(), //TODO: Figure out actual correct hiding behavior
  //       path: "/"
  //     });
  //   captureEvent("spotlightItemHideItemClicked", { document: spotlight.document })
  // }, [setCookie, cookieName, spotlight, captureEvent]);

  // TODO test
  const [isHidden, hideUntil] = useHideWithCookie(HIDDEN_SPOTLIGHT_ITEMS, spotlight?._id)
  
  const hideBanner = useCallback(() => {
    hideUntil(moment().add(30, 'days').toDate()), //TODO: Figure out actual correct hiding behavior
    captureEvent("spotlightItemHideItemClicked", { document: spotlight.document })
  }, [hideUntil, captureEvent, spotlight.document]);

  if (spotlight && !isHidden) {
    return <SpotlightItem key={spotlight._id} spotlight={spotlight} hideBanner={hideBanner}/>
  }
  return null
}

const CurrentSpotlightItemComponent = registerComponent('CurrentSpotlightItem', CurrentSpotlightItem);

declare global {
  interface ComponentTypes {
    CurrentSpotlightItem: typeof CurrentSpotlightItemComponent
  }
}

