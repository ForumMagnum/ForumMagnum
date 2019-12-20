import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import {AnalyticsContext} from "../../lib/analyticsEvents";

const styles = theme => ({
});

const RecommendationsPage = ({ classes }) => {
  const { ConfigurableRecommendationsList } = Components;
  
  return (
  <AnalyticsContext listContext={"recommendationsPage"} capturePostItemOnMount>
    <ConfigurableRecommendationsList configName="recommendationspage" />
  </AnalyticsContext>
  )
};

registerComponent('RecommendationsPage', RecommendationsPage,
  withStyles(styles, {name:"RecommendationsPage"})
);
