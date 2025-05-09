import moment from 'moment';
import React, { useCallback, useMemo } from 'react';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_SPOTLIGHT_ITEM_PREFIX } from '../../lib/cookies/cookies';
import { useCurrentFrontpageSpotlight } from '../hooks/useCurrentFrontpageSpotlight';
import { SpotlightItem } from "./SpotlightItem";
import { SingleColumnSection } from "../common/SingleColumnSection";

export const DismissibleSpotlightItemInner = ({
  current,
  spotlight,
  standaloneSection,
  className,
}: {
  current?: boolean,
  spotlight?: SpotlightDisplay,
  standaloneSection?: boolean
  className?: string,
}) => {
  const { captureEvent } = useTracking()

  const currentSpotlight = useCurrentFrontpageSpotlight({
    fragmentName: "SpotlightDisplay",
    skip: !current,
  });
  const displaySpotlight = currentSpotlight ?? spotlight;
  const spotlightDocument = displaySpotlight?.post ?? displaySpotlight?.sequence ?? displaySpotlight?.tag;

  const cookieName = useMemo(() => `${HIDE_SPOTLIGHT_ITEM_PREFIX}${spotlightDocument?._id}`, [spotlightDocument]); //hiding in one place, hides everywhere
  const [cookies, setCookie] = useCookiesWithConsent([cookieName]);

  const isHidden = useMemo(() => !!cookies[cookieName], [cookies, cookieName]);

  const hideBanner = useCallback(() => {
    setCookie(
      cookieName,
      "true", {
        expires: moment().add(30, 'days').toDate(), //TODO: Figure out actual correct hiding behavior
        path: "/"
      });
    captureEvent("spotlightItemHideItemClicked", { document: spotlightDocument })
  }, [setCookie, cookieName, spotlightDocument, captureEvent]);

  if (displaySpotlight && !isHidden) {
    const spotlightElement = (
      <AnalyticsContext pageElementContext="spotlightItem">
        <SpotlightItem
          key={displaySpotlight._id}
          spotlight={displaySpotlight}
          hideBanner={hideBanner}
          className={className}
        />
      </AnalyticsContext>
    );

    if (standaloneSection) {
      return (
        <SingleColumnSection>
          {spotlightElement}
        </SingleColumnSection>
      );
    }
    return spotlightElement;
  }
  return null
}

export const DismissibleSpotlightItem = registerComponent('DismissibleSpotlightItem', DismissibleSpotlightItemInner);


