import React, { useState } from 'react';
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
  const { RecommendationsList, SingleColumnSection, SectionTitle, EditableUsersList } = Components;
  const [ userOverride, setUserOverride ] = useState<string[]| null>




  const recombeeRecommendationOverrideControls = <div>
    <div>
      <label htmlFor="userOverride">User Override:</label>
      <EditableUsersList
        value={userOverride}
        setValue={(newUsers: string[]) => {
          setUserOverride(newUsers)
        }}
        label="override with user"
      />
    </div>
    <div>
      <label htmlFor="sourceType">Source Type:</label>
      <select id="sourceType">
        <option value="default">Default</option>
        <option value="source1">Source 1</option>
        <option value="source2">Source 2</option>
      </select>
    </div>
    <div>
      <label htmlFor="rotationRate">Rotation Rate:</label>
      <input type="number" id="rotationRate" />
    </div>
  </div>







  return (
    <AnalyticsContext
      pageSubSectionContext="belowLatestPostsRecommendations"
      capturePostItemOnMount
    >
      <SingleColumnSection>
        <SectionTitle title="Recommendations" />

        {/* check whether user is admin */}
        userIsAdmin(currentUser) && 

        <RecommendationsList algorithm={recommendationSettings} />
      </SingleColumnSection>
    </AnalyticsContext>
  );

const HomepageRecommendationsComponent = registerComponent('HomepageRecommendations', HomepageRecommendations, {styles});

declare global {
  interface ComponentTypes {
    HomepageRecommendations: typeof HomepageRecommendationsComponent
  }
}
