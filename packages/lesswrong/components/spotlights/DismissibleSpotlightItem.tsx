import moment from 'moment';
import React, { useCallback, useMemo } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_SPOTLIGHT_ITEM_PREFIX } from '../../lib/cookies/cookies';
import { useCurrentFrontpageSpotlight } from '../hooks/useCurrentFrontpageSpotlight';
import { useDismissable } from '../hooks/useDismissable';

export const DismissibleSpotlightItem = ({
  current,
  spotlight,
  className,
}: {
  current?: boolean,
  spotlight?: SpotlightDisplay,
  className?: string,
}) => {
  const { SpotlightItem } = Components

  const currentSpotlight = useCurrentFrontpageSpotlight({
    fragmentName: "SpotlightDisplay",
    skip: !current,
  });
  const displaySpotlight = currentSpotlight ?? spotlight;

  const cookieName = useMemo(() => `${HIDE_SPOTLIGHT_ITEM_PREFIX}${displaySpotlight?.document._id}`, [displaySpotlight]); //hiding in one place, hides everywhere
  const { dismiss, dismissed } = useDismissable(cookieName, 1);

  if (displaySpotlight && !dismissed) {
    return <SpotlightItem
      key={displaySpotlight._id}
      spotlight={displaySpotlight}
      hideBanner={dismiss}
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
