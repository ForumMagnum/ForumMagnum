import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext } from "../../lib/analyticsEvents";
import type { RecommendationsAlgorithm } from '../../lib/collections/users/recommendationSettings';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const HomepageRecommendations = ({ recommendationSettings, classes }: {
  recommendationSettings: RecommendationsAlgorithm
  classes: ClassesType<typeof styles>,
}) => {
  const { RecommendationsList, SingleColumnSection, SectionTitle } = Components;

  return (
    <SingleColumnSection>
      <SectionTitle title="Recommendations" />
      <AnalyticsContext
        pageSubSectionContext="belowLatestPostsRecommendations"
        capturePostItemOnMount
      >
        <RecommendationsList algorithm={recommendationSettings} />
      </AnalyticsContext>
    </SingleColumnSection>
  );
}

const HomepageRecommendationsComponent = registerComponent('HomepageRecommendations', HomepageRecommendations, {styles});

declare global {
  interface ComponentTypes {
    HomepageRecommendations: typeof HomepageRecommendationsComponent
  }
}
