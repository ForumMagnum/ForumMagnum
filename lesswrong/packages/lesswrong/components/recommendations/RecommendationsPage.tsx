import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { isLW } from '../../lib/instanceSettings';

const RecommendationsPage = () => {
  const { ConfigurableRecommendationsList, RecommendationsPageCuratedList, SpotlightHistory  } = Components;

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

