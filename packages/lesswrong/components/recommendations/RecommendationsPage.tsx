import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";

const RecommendationsPage = ({classes}: {
  classes: ClassesType
}) => {
  const { ConfigurableRecommendationsList, RecommendationsPageCuratedList } = Components;

  return (
    <AnalyticsContext pageSectionContext={"recommendationsPage"} capturePostItemOnMount>
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

