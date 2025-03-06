import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { isLW } from '../../lib/instanceSettings';
import ConfigurableRecommendationsList from "@/components/recommendations/ConfigurableRecommendationsList";
import RecommendationsPageCuratedList from "@/components/recommendations/RecommendationsPageCuratedList";
import SpotlightHistory from "@/components/spotlights/SpotlightHistory";

const RecommendationsPage = () => {
  return (
    <AnalyticsContext pageSectionContext={"recommendationsPage"} capturePostItemOnMount>
      {isLW && <SpotlightHistory/>}
      <RecommendationsPageCuratedList/>
      <ConfigurableRecommendationsList configName="recommendationspage" />
    </AnalyticsContext>
  )
};

const RecommendationsPageComponent = registerComponent('RecommendationsPage', RecommendationsPage);

declare global {
  interface ComponentTypes {
    RecommendationsPage: typeof RecommendationsPageComponent
  }
}

export default RecommendationsPageComponent;

