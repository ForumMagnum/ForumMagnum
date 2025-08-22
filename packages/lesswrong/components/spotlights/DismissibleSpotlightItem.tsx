import moment from 'moment';
import React, { useCallback, useMemo } from 'react';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_SPOTLIGHT_ITEM_PREFIX } from '../../lib/cookies/cookies';
import { SpotlightItem } from "./SpotlightItem";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';

const DisplaySpotlightQuery = gql(`
  query DisplaySpotlightQuery {
    currentSpotlight {
      ...SpotlightDisplay
    }
  }
`);

export const DismissibleSpotlightItem = ({ className }: {
  className?: string,
}) => {
  const { captureEvent } = useTracking()

  const { data } = useQuery(DisplaySpotlightQuery, {
    context: {loggedOutCache: true},
  });
  const currentSpotlight = data?.currentSpotlight;
  const spotlightDocument = currentSpotlight?.post ?? currentSpotlight?.sequence ?? currentSpotlight?.tag;

  const cookieName = `${HIDE_SPOTLIGHT_ITEM_PREFIX}${spotlightDocument?._id}`; //hiding in one place, hides everywhere
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

  if (!currentSpotlight || isHidden) {
    return null;
  }

  return <AnalyticsContext pageElementContext="spotlightItem">
    <SpotlightItem
      key={currentSpotlight._id}
      spotlight={currentSpotlight}
      hideBanner={hideBanner}
      className={className}
    />
  </AnalyticsContext>
}

const spotlightItemFallbackStyles = defineStyles("SpotlightItemFallback", (theme) => ({
  fallback: {
    height: 181,
  },
}));

export const SpotlightItemFallback = () => {
  const classes = useStyles(spotlightItemFallbackStyles);
  return <div className={classes.fallback}/>
}

export default DismissibleSpotlightItem;


