import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext } from '../../lib/analyticsEvents';
import moment from '../../lib/moment-timezone';
import { useTimezone } from '../common/withTimezone';
import { EA_FORUM_COMMUNITY_TOPIC_ID } from '../../lib/collections/tags/collection';
import { useExpandedFrontpageSection } from '../hooks/useExpandedFrontpageSection';
import { SHOW_COMMUNITY_POSTS_SECTION_COOKIE } from '../../lib/cookies/cookies';
import { useFilterSettings } from '../../lib/filterSettings';

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

const EAHomeCommunityPosts = ({classes}:{classes: ClassesType}) => {
  const {expanded, toggleExpanded} = useExpandedFrontpageSection({
    section: "community",
    onExpandEvent: "communityPostsSectionExpanded",
    onCollapseEvent: "communityPostsSectionCollapsed",
    defaultExpanded: "loggedIn",
    cookieName: SHOW_COMMUNITY_POSTS_SECTION_COOKIE,
  });
  const { timezone } = useTimezone()
  const {filterSettings: userFilterSettings} = useFilterSettings()

  const now = moment().tz(timezone)
  const dateCutoff = now.subtract(90, 'days').format("YYYY-MM-DD")

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
      Content={() => (
        <>
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
        </>
      )}
    />
  );
}

const EAHomeCommunityPostsComponent = registerComponent('EAHomeCommunityPosts', EAHomeCommunityPosts, {styles});

declare global {
  interface ComponentTypes {
    EAHomeCommunityPosts: typeof EAHomeCommunityPostsComponent
  }
}
