import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { showCuratedSetting } from '../../lib/publicSettings';

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

const RecommendationsPageCuratedList = ({classes}: {
  classes: ClassesType
}) => {
  const { PostsList2, SingleColumnSection, SectionTitle, SunshineCuratedSuggestionsList } = Components;

  const currentUser = useCurrentUser()

  return (
    <div>
      <AnalyticsContext pageContext={"curatedPage"}>
        {showCuratedSetting.get() && <SingleColumnSection>
          <AnalyticsContext pageSectionContext={"curatedPosts"} capturePostItemOnMount>
            <SectionTitle title="Curated Posts"/>
            <PostsList2
              terms={{view:"curated", limit: 12}}
              showNoResults={false}
              boxShadow={false}
              curatedIconLeft={true}
            />
          </AnalyticsContext>
        </SingleColumnSection>}
        {showCuratedSetting.get() && currentUser?.isAdmin && <div className={classes.curated}>
          <SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions", limit: 50}} belowFold/>
        </div>}
      </AnalyticsContext>
    </div>
  )
};

const RecommendationsPageCuratedListComponent = registerComponent('RecommendationsPageCuratedList', RecommendationsPageCuratedList, {styles});

declare global {
  interface ComponentTypes {
    RecommendationsPageCuratedList: typeof RecommendationsPageCuratedListComponent
  }
}

