import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { hasCuratedPostsSetting } from '../../lib/instanceSettings';
import { PostsList2 } from "../posts/PostsList2";
import { SingleColumnSection } from "../common/SingleColumnSection";
import { SectionTitle } from "../common/SectionTitle";
import { SunshineCuratedSuggestionsList } from "../sunshineDashboard/SunshineCuratedSuggestionsList";

const styles = (theme: ThemeType) => ({
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

const RecommendationsPageCuratedListInner = ({classes}: {
  classes: ClassesType<typeof styles>
}) => {
  const currentUser = useCurrentUser()

  return (
    <div>
      <AnalyticsContext pageContext={"curatedPage"}>
        {hasCuratedPostsSetting.get() && <SingleColumnSection>
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
        {hasCuratedPostsSetting.get() && currentUser?.isAdmin && <div className={classes.curated}>
          <SunshineCuratedSuggestionsList terms={{view:"sunshineCuratedSuggestions", limit: 50}} atBottom/>
        </div>}
      </AnalyticsContext>
    </div>
  )
};

export const RecommendationsPageCuratedList = registerComponent('RecommendationsPageCuratedList', RecommendationsPageCuratedListInner, {styles});


