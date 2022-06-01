import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { forumTypeSetting } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
});

const RecommendationsPage = ({classes}: {
  classes: ClassesType
}) => {
  const { ConfigurableRecommendationsList, PostsList2, SingleColumnSection, SectionTitle } = Components;

  const showCurated = forumTypeSetting.get() === 'LessWrong'

  return (
    <div>
      <AnalyticsContext listContext={"recommendationsPage"} capturePostItemOnMount>
        <ConfigurableRecommendationsList configName="recommendationspage" />
      </AnalyticsContext>
      {showCurated && <SingleColumnSection>
        <SectionTitle title="Curated Posts"/>
        <AnalyticsContext listContext={"curatedPosts"}>
          <PostsList2
            terms={{view:"curated", limit: 20}}
            showNoResults={false}
            boxShadow={false}
            curatedIconLeft={true}
          />
        </AnalyticsContext>
      </SingleColumnSection>}
    </div>
  )
};

const RecommendationsPageComponent = registerComponent('RecommendationsPage', RecommendationsPage, {styles});

declare global {
  interface ComponentTypes {
    RecommendationsPage: typeof RecommendationsPageComponent
  }
}

