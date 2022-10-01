import moment from 'moment';
import React, { useCallback, useMemo } from 'react';
import { useCookies } from 'react-cookie';
import { useTracking } from '../../lib/analyticsEvents';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';

const HIDE_SPOTLIGHT_ITEM_PREFIX = 'hide_spotlight_item_';

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

  const cookieName = useMemo(() => `${HIDE_SPOTLIGHT_ITEM_PREFIX}${spotlight?.document._id}`, [spotlight]); //hiding in one place, hides everywhere
  const [cookies, setCookie] = useCookies([cookieName]);

  const isHidden = useMemo(() => !!cookies[cookieName], [cookies, cookieName]);

  const hideBanner = useCallback(() => {
    setCookie(
      cookieName,
      "true", {
        expires: moment().add(30, 'days').toDate(), //TODO: Figure out actual correct hiding behavior
        path: "/"
      });
    captureEvent("spotlightItemHideItemClicked", { document: spotlight.document })
  }, [setCookie, cookieName, spotlight, captureEvent]);  

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

