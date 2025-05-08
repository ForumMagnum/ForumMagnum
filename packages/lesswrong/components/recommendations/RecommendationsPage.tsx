import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { isLW } from '../../lib/instanceSettings';

const RecommendationsPageInner = () => {
  const { ConfigurableRecommendationsList, RecommendationsPageCuratedList, SpotlightHistory  } = Components;

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

