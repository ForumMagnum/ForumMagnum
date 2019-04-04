import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
});

const RecommendationsPage = ({ classes }) => {
  const { SingleColumnSection, SectionTitle, RecommendationsList } = Components;
  
  return <SingleColumnSection>
    <SectionTitle title="Recommended" />
    <RecommendationsList count={15}/>
  </SingleColumnSection>
};

registerComponent('RecommendationsPage', RecommendationsPage,
  withStyles(styles, {name:"RecommendationsPage"})
);
