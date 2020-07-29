import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";

const styles = (theme: ThemeType): JssStyles => ({
});

const RecommendationsPage = ({ classes }) => {
  const { ConfigurableRecommendationsList } = Components;
  
  return (
  <AnalyticsContext listContext={"recommendationsPage"} capturePostItemOnMount>
    <ConfigurableRecommendationsList configName="recommendationspage" />
  </AnalyticsContext>
  )
};

const RecommendationsPageComponent = registerComponent('RecommendationsPage', RecommendationsPage, {styles});

declare global {
  interface ComponentTypes {
    RecommendationsPage: typeof RecommendationsPageComponent
  }
}

