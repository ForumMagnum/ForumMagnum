import moment from 'moment';
import React, { useCallback, useMemo } from 'react';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_SPOTLIGHT_ITEM_PREFIX } from '../../lib/cookies/cookies';
import { useCurrentFrontpageSpotlight } from '../hooks/useCurrentFrontpageSpotlight';
import { FullPageSpotlight } from './FullPageSpotlight';

export const DismissibleSpotlightItem = ({
  current,
  spotlight,
  className,
  fullpage,
}: {
  current?: boolean,
  spotlight?: SpotlightDisplay,
  fullpage?: boolean,
  className?: string
}) => {
  const { SpotlightItem, FullPageSpotlight } = Components
  const { captureEvent } = useTracking()

  const currentSpotlight = useCurrentFrontpageSpotlight({
    fragmentName: "SpotlightDisplay",
    skip: !current,
  });
  const displaySpotlight = currentSpotlight ?? spotlight;

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
    return <AnalyticsContext pageElementContext="spotlightItem">
      {fullpage ?
        <FullPageSpotlight
          key={displaySpotlight._id}
          spotlight={displaySpotlight}
          hideBanner={hideBanner}
          className={className}
          showAdminInfo
        />
        
      : <SpotlightItem
          key={displaySpotlight._id}
          spotlight={displaySpotlight}
          hideBanner={hideBanner}
          className={className}
        />
      }
    </AnalyticsContext>
  }
  return null
}

const DismissibleSpotlightItemComponent = registerComponent('DismissibleSpotlightItem', DismissibleSpotlightItem);

declare global {
  interface ComponentTypes {
    DismissibleSpotlightItem: typeof DismissibleSpotlightItemComponent
  }
}
