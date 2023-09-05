import moment from 'moment';
import React, { useCallback, useMemo } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { useMulti } from '../../lib/crud/withMulti';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_SPOTLIGHT_ITEM_PREFIX } from '../../lib/cookies/cookies';

export const DismissibleSpotlightItem = ({
  current,
  spotlight,
  className,
  classes,
}: {
  current?: boolean,
  spotlight?: SpotlightDisplay,
  className?: string,
  classes: ClassesType,
}) => {
  const { SpotlightItem } = Components
  const { captureEvent } = useTracking()

  const { results: currentSpotlightResults } = useMulti({
    collectionName: 'Spotlights',
    fragmentName: 'SpotlightDisplay',
    terms: {
      view: 'mostRecentlyPromotedSpotlights',
      limit: 1
    },
    skip: !current,
  });
  const displaySpotlight = currentSpotlightResults?.[0] ?? spotlight;

  const cookieName = useMemo(() => `${HIDE_SPOTLIGHT_ITEM_PREFIX}${displaySpotlight?.document._id}`, [displaySpotlight]); //hiding in one place, hides everywhere
  const [cookies, setCookie] = useCookiesWithConsent([cookieName]);

  const isHidden = useMemo(() => !!cookies[cookieName], [cookies, cookieName]);

  const hideBanner = useCallback(() => {
    setCookie(
      cookieName,
      "true", {
        expires: moment().add(30, 'days').toDate(), //TODO: Figure out actual correct hiding behavior
        path: "/"
      });
    captureEvent("spotlightItemHideItemClicked", { document: displaySpotlight?.document })
  }, [setCookie, cookieName, displaySpotlight, captureEvent]);

  if (displaySpotlight && !isHidden) {
    return <SpotlightItem
      key={displaySpotlight._id}
      spotlight={displaySpotlight}
      hideBanner={hideBanner}
      className={className}
    />
  }
  return null
}

const DismissibleSpotlightItemComponent = registerComponent('DismissibleSpotlightItem', DismissibleSpotlightItem);

declare global {
  interface ComponentTypes {
    DismissibleSpotlightItem: typeof DismissibleSpotlightItemComponent
  }
}
