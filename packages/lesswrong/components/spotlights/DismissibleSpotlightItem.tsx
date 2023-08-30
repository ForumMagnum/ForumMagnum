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
  if (currentSpotlightResults && currentSpotlightResults.length > 0) {
    spotlight = currentSpotlightResults[0];
  }

  const cookieName = useMemo(() => `${HIDE_SPOTLIGHT_ITEM_PREFIX}${spotlight?.document._id}`, [spotlight]); //hiding in one place, hides everywhere
  const [cookies, setCookie] = useCookiesWithConsent([cookieName]);

  const isHidden = useMemo(() => !!cookies[cookieName], [cookies, cookieName]);

  const hideBanner = useCallback(() => {
    setCookie(
      cookieName,
      "true", {
        expires: moment().add(30, 'days').toDate(), //TODO: Figure out actual correct hiding behavior
        path: "/"
      });
    captureEvent("spotlightItemHideItemClicked", { document: spotlight?.document })
  }, [setCookie, cookieName, spotlight, captureEvent]);

  if (spotlight && !isHidden) {
    return <SpotlightItem
      key={spotlight._id}
      spotlight={spotlight}
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
