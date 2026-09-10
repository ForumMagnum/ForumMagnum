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

// Let the parent suspend until we know which spotlight to show and whether it
// has been dismissed, so it can position content below the spotlight correctly.
export const DismissibleSpotlightItemSuspense = ({ className, spotlightId, loadingStyle="spinner" }: {
  className?: string,
  spotlightId?: string | null,
  loadingStyle?: "placeholder"|"spinner",
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
    <SuspenseWrapper
      name="SpotlightItem"
      fallback={loadingStyle==="placeholder" ? <SpotlightItemFallback className={className}/> : <Loading/>}
    >
      <SpotlightItem
        key={spotlight._id}
        spotlight={spotlight}
        hideBanner={hideBanner}
        className={className}
      />
    </SuspenseWrapper>
  </AnalyticsContext>
}

const spotlightItemFallbackStyles = defineStyles("SpotlightItemFallback", () => ({
  fallback: {
    height: 181,
  },
}));

export const SpotlightItemFallback = ({className}: {className?: string}) => {
  const classes = useStyles(spotlightItemFallbackStyles);
  return <div className={classNames(classes.fallback, className)}/>
}

export const DismissibleSpotlightItem = ({loadingStyle="spinner", className, spotlightId}: {
  loadingStyle?: "placeholder"|"spinner"
  className?: string
  spotlightId?: string | null
}) => {
  return <SuspenseWrapper
    name="DismissibleSpotlightItem"
    fallback={loadingStyle==="placeholder" ? <SpotlightItemFallback className={className}/> : <Loading/>}
  >
    <DismissibleSpotlightItemSuspense
      className={className}
      spotlightId={spotlightId}
      loadingStyle={loadingStyle}
    />
  </SuspenseWrapper>
}

export default DismissibleSpotlightItem;

