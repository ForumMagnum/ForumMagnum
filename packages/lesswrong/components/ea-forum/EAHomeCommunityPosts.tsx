import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import moment from '../../lib/moment-timezone';
import { EA_FORUM_COMMUNITY_TOPIC_ID } from '../../lib/collections/tags/helpers';
import { useExpandedFrontpageSection } from '../hooks/useExpandedFrontpageSection';
import { SHOW_COMMUNITY_POSTS_SECTION_COOKIE } from '../../lib/cookies/cookies';
import { useFilterSettings } from '../../lib/filterSettings';
import { frontpageDaysAgoCutoffSetting } from '../../lib/scoring';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { ExpandableSection } from "../common/ExpandableSection";
import { PostsList2 } from "../posts/PostsList2";
import { SectionFooter } from "../common/SectionFooter";

const styles = (theme: ThemeType) => ({
  readMoreLinkMobile: {
    display: 'none',
    fontSize: 14,
    color: theme.palette.grey[600],
    fontWeight: 600,
    '@media (max-width: 350px)': {
      display: 'block'
    },
  }
})

const EAHomeCommunityPostsInner = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const {expanded, toggleExpanded} = useExpandedFrontpageSection({
    section: "community",
    onExpandEvent: "communityPostsSectionExpanded",
    onCollapseEvent: "communityPostsSectionCollapsed",
    defaultExpanded: "all",
    cookieName: SHOW_COMMUNITY_POSTS_SECTION_COOKIE,
  });
  const now = useCurrentTime();
  const {filterSettings: userFilterSettings} = useFilterSettings()

  const dateCutoff = moment(now).subtract(frontpageDaysAgoCutoffSetting.get()*24, 'hours').startOf('hour').toISOString()

  const recentPostsTerms = {
    view: "magic",
    filterSettings: {
      // Include the user's personal blog filter setting but override the tags filter
      ...userFilterSettings,
      tags: [
        {
          tagId: EA_FORUM_COMMUNITY_TOPIC_ID,
          filterMode: "Required",
        },
      ],
    },
    after: dateCutoff,
    limit: 5,
  } as const;
  return (
    <ExpandableSection
      pageSectionContext="communityPosts"
      expanded={expanded}
      toggleExpanded={toggleExpanded}
      title="Posts tagged community"
      afterTitleTo="/topics/community"
    >
      <AnalyticsContext listContext={"communityPosts"}>
        <PostsList2 terms={recentPostsTerms} showLoadMore={false} hideHiddenFrontPagePosts />
      </AnalyticsContext>
      <SectionFooter>
        <Link
          to="/topics/community"
          className={classes.readMoreLinkMobile}
        >
          View more
        </Link>
      </SectionFooter>
    </ExpandableSection>
  );
}

export const EAHomeCommunityPosts = registerComponent('EAHomeCommunityPosts', EAHomeCommunityPostsInner, {styles});


