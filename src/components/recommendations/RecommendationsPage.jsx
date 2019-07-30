import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
});

const RecommendationsPage = ({ classes }) => {
  const { ConfigurableRecommendationsList } = Components;
  
  return <ConfigurableRecommendationsList configName="recommendationspage" />
};

registerComponent('RecommendationsPage', RecommendationsPage,
  withStyles(styles, {name:"RecommendationsPage"})
);
