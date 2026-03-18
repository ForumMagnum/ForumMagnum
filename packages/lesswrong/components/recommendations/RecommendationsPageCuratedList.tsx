import React from 'react';
import {AnalyticsContext} from "../../lib/analyticsEvents";
import { useCurrentUser } from '../common/withUser';
import { hasCuratedPostsSetting } from '../../lib/instanceSettings';
import PostsList2 from "../posts/PostsList2";
import SingleColumnSection from "../common/SingleColumnSection";
import SectionTitle from "../common/SectionTitle";
import SunshineCuratedSuggestionsList from "../sunshineDashboard/SunshineCuratedSuggestionsList";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles('RecommendationsPageCuratedList', (theme: ThemeType) => ({
  curated: {
    position: "absolute",
    right: 0,
    top: 65,
    width: 210,
    [theme.breakpoints.down('md')]: {
      display: "none"
    }
  }
}));

const RecommendationsPageCuratedList = () => {
  const classes = useStyles(styles);
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
          <SunshineCuratedSuggestionsList limit={50}/>
        </div>}
      </AnalyticsContext>
    </div>
  )
};

export default RecommendationsPageCuratedList


