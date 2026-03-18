import moment from 'moment';
import classNames from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { HIDE_SPOTLIGHT_ITEM_PREFIX } from '../../lib/cookies/cookies';
import { SpotlightItem } from "./SpotlightItem";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useSuspenseQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import Loading from '../vulcan-core/Loading';
import { SuspenseWrapper } from '../common/SuspenseWrapper';

const DisplaySpotlightQuery = gql(`
  query DisplaySpotlightQuery {
    currentSpotlight {
      ...SpotlightDisplay
    }
  }
`);

const DisplaySpotlightByIdQuery = gql(`
  query DisplaySpotlightByIdQuery($spotlightId: String) {
    spotlight(selector: { _id: $spotlightId }) {
      result {
        ...SpotlightDisplay
      }
    }
  }
`);

const DismissibleSpotlightItemInner = ({ className, spotlightId }: {
  className?: string,
  spotlightId?: string | null,
}) => {
  const { captureEvent } = useTracking()

  const { data } = useSuspenseQuery(DisplaySpotlightQuery, {
    context: {loggedOutCache: true},
  });
  const { data: spotlightByIdData } = useSuspenseQuery(DisplaySpotlightByIdQuery, {
    variables: { spotlightId },
    context: {loggedOutCache: true},
    skip: !spotlightId,
  });
  const currentSpotlight = data?.currentSpotlight;
  const overrideSpotlight = spotlightByIdData?.spotlight?.result;
  const spotlight = overrideSpotlight ?? currentSpotlight;
  const spotlightDocument = spotlight?.post ?? spotlight?.sequence ?? spotlight?.tag;

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

  if (!spotlight || isHidden) {
    return null;
  }

  return <AnalyticsContext pageElementContext="spotlightItem">
    <SpotlightItem
      key={spotlight._id}
      spotlight={spotlight}
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

const responsiveSpotlightStyles = defineStyles("DismissibleSpotlightItem", () => ({
  showBelowLessOnlineBreakpoint: {
    ['@media(min-width: 1200px)']: {
      display: "none",
    },
  },
  showAtOrAboveLessOnlineBreakpoint: {
    ['@media(max-width: 1199.95px)']: {
      display: "none",
    },
  },
}));

export const SpotlightItemFallback = () => {
  const classes = useStyles(spotlightItemFallbackStyles);
  return <div className={classes.fallback}/>
}

export const DismissibleSpotlightItem = ({loadingStyle="spinner", className, spotlightId, screenVisibility}: {
  loadingStyle?: "placeholder"|"spinner"
  className?: string
  spotlightId?: string | null
  screenVisibility?: "belowLessOnlineBreakpoint" | "atOrAboveLessOnlineBreakpoint"
}) => {
  const classes = useStyles(responsiveSpotlightStyles);
  const responsiveClassName = screenVisibility === "belowLessOnlineBreakpoint"
    ? classes.showBelowLessOnlineBreakpoint
    : screenVisibility === "atOrAboveLessOnlineBreakpoint"
      ? classes.showAtOrAboveLessOnlineBreakpoint
      : undefined;

  return <SuspenseWrapper
    name="DismissibleSpotlightItem"
    fallback={loadingStyle==="placeholder" ? <SpotlightItemFallback/> : <Loading/>}
  >
    <DismissibleSpotlightItemInner
      className={classNames(className, responsiveClassName)}
      spotlightId={spotlightId}
    />
  </SuspenseWrapper>
}

export default DismissibleSpotlightItem;


