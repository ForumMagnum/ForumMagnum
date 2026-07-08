import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import ConfigurableRecommendationsList from "./ConfigurableRecommendationsList";
import RecommendationsPageCuratedList from "./RecommendationsPageCuratedList";

const RecommendationsPage = () => {
  return (
    <AnalyticsContext pageSectionContext={"recommendationsPage"} capturePostItemOnMount>
      <RecommendationsPageCuratedList/>
      <ConfigurableRecommendationsList configName="recommendationspage" />
    </AnalyticsContext>
  )
};

export default registerComponent('RecommendationsPage', RecommendationsPage);
