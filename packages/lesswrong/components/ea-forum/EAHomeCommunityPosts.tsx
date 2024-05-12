import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import moment from '../../lib/moment-timezone';
import { EA_FORUM_COMMUNITY_TOPIC_ID } from '../../lib/collections/tags/collection';
import { useExpandedFrontpageSection } from '../hooks/useExpandedFrontpageSection';
import { SHOW_COMMUNITY_POSTS_SECTION_COOKIE } from '../../lib/cookies/cookies';
import { useFilterSettings } from '../../lib/filterSettings';
import { frontpageDaysAgoCutoffSetting } from '../../lib/scoring';
import { useCurrentTime } from '../../lib/utils/timeUtil';

const styles = (theme: ThemeType): JssStyles => ({
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

const EAHomeCommunityPosts = ({classes}: {classes: ClassesType}) => {
  const {expanded, toggleExpanded} = useExpandedFrontpageSection({
    section: "community",
    onExpandEvent: "communityPostsSectionExpanded",
    onCollapseEvent: "communityPostsSectionCollapsed",
    defaultExpanded: "loggedIn",
    cookieName: SHOW_COMMUNITY_POSTS_SECTION_COOKIE,
  });
  const now = useCurrentTime();
  const {filterSettings: userFilterSettings} = useFilterSettings()

  const dateCutoff = moment(now).subtract(frontpageDaysAgoCutoffSetting.get(), 'days').startOf('hour').toISOString()

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
  };

  const {ExpandableSection, PostsList2, SectionFooter} = Components;
  return (
    <ExpandableSection
      pageSectionContext="communityPosts"
      expanded={expanded}
      toggleExpanded={toggleExpanded}
      title="Posts tagged community"
      afterTitleTo="/topics/community"
    >
      <AnalyticsContext listContext={"communityPosts"}>
        <PostsList2 terms={recentPostsTerms} showLoadMore={false} />
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

const EAHomeCommunityPostsComponent = registerComponent('EAHomeCommunityPosts', EAHomeCommunityPosts, {styles});

declare global {
  interface ComponentTypes {
    EAHomeCommunityPosts: typeof EAHomeCommunityPostsComponent
  }
}
