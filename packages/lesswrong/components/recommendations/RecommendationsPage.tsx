"use client";

import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { isLW } from '../../lib/instanceSettings';
import ConfigurableRecommendationsList from "./ConfigurableRecommendationsList";
import RecommendationsPageCuratedList from "./RecommendationsPageCuratedList";
import SpotlightHistory from "../spotlights/SpotlightHistory";

const RecommendationsPage = () => {
  return (
    <AnalyticsContext pageSectionContext={"recommendationsPage"} capturePostItemOnMount>
      {isLW && <SpotlightHistory/>}
      <RecommendationsPageCuratedList/>
      <ConfigurableRecommendationsList configName="recommendationspage" />
    </AnalyticsContext>
  )
};

export default registerComponent('RecommendationsPage', RecommendationsPage);



