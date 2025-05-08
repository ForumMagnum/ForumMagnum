import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { isLW } from '../../lib/instanceSettings';
import { ConfigurableRecommendationsList } from "./ConfigurableRecommendationsList";
import { RecommendationsPageCuratedList } from "./RecommendationsPageCuratedList";
import { SpotlightHistory } from "../spotlights/SpotlightHistory";

const RecommendationsPageInner = () => {
  return (
    <AnalyticsContext pageSectionContext={"recommendationsPage"} capturePostItemOnMount>
      {isLW && <SpotlightHistory/>}
      <RecommendationsPageCuratedList/>
      <ConfigurableRecommendationsList configName="recommendationspage" />
    </AnalyticsContext>
  )
};

export const RecommendationsPage = registerComponent('RecommendationsPage', RecommendationsPageInner);

declare global {
  interface ComponentTypes {
    RecommendationsPage: typeof RecommendationsPage
  }
}

