import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { forumTypeSetting } from '../../lib/instanceSettings';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles => ({
  curated: {
    position: "absolute",
    right: 0,
    top: 65,
    width: 210,
    [theme.breakpoints.down('md')]: {
      display: "none"
    }
  }
});

const RecommendationsPage = ({classes}: {
  classes: ClassesType
}) => {
  const { ConfigurableRecommendationsList, PostsList2, SingleColumnSection, SectionTitle, SunshineCuratedSuggestionsList } = Components;

  const currentUser = useCurrentUser()
  const showCurated = forumTypeSetting.get() === 'LessWrong'

  return (
    <div>
      {showCurated && <SingleColumnSection>
        <SectionTitle title="Curated Posts"/>
        <AnalyticsContext listContext={"curatedPosts"}>
          <PostsList2
            terms={{view:"curated", limit: 12}}
            showNoResults={false}
            boxShadow={false}
            curatedIconLeft={true}
          />
        </AnalyticsContext>
      </SingleColumnSection>}
      <AnalyticsContext listContext={"recommendationsPage"} capturePostItemOnMount>
        <ConfigurableRecommendationsList configName="recommendationspage" />
      </AnalyticsContext>
      {showCurated && currentUser?.isAdmin && <div className={classes.curated}>
        <SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions", limit: 50}} belowFold/>
      </div>}
    </div>
  )
};

const RecommendationsPageComponent = registerComponent('RecommendationsPage', RecommendationsPage, {styles});

declare global {
  interface ComponentTypes {
    RecommendationsPage: typeof RecommendationsPageComponent
  }
}

