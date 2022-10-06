import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { forumTypeSetting } from '../../lib/instanceSettings';

const RecommendationsPage = ({classes}: {
  classes: ClassesType
}) => {
  const { ConfigurableRecommendationsList, RecommendationsPageCuratedList, SpotlightHistory  } = Components;

  return (
    <AnalyticsContext pageSectionContext={"recommendationsPage"} capturePostItemOnMount>
      {forumTypeSetting.get() === "LessWrong" && <SpotlightHistory/>}
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

