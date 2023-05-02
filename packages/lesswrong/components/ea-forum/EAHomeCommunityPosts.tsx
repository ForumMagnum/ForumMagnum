import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { Link } from '../../lib/reactRouterWrapper';
import { AnalyticsContext, useTracking } from '../../lib/analyticsEvents';
import moment from '../../lib/moment-timezone';
import { useTimezone } from '../common/withTimezone';
import { EA_FORUM_COMMUNITY_TOPIC_ID } from '../../lib/collections/tags/collection';
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { SHOW_COMMUNITY_POSTS_SECTION_COOKIE } from '../../lib/cookies/cookies';

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 10
  },
  expandIcon: {
    position: 'relative',
    top: 3,
    fontSize: 16,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[800],
    }
  },
  readMoreLink: {
    fontSize: 14,
    color: theme.palette.grey[600],
    fontWeight: 600,
    '@media (max-width: 350px)': {
      display: 'none'
    },
  },
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
  const [cookies, setCookie, removeCookie] = useCookiesWithConsent([SHOW_COMMUNITY_POSTS_SECTION_COOKIE])
  // default to collapsing the section
  const [sectionExpanded, setSectionExpanded] = useState(cookies[SHOW_COMMUNITY_POSTS_SECTION_COOKIE])
  const { captureEvent } = useTracking()
  const { timezone } = useTimezone()
  
  const toggleSectionVisibility = () => {
    setSectionExpanded(!sectionExpanded)
    
    if (sectionExpanded) {
      removeCookie(SHOW_COMMUNITY_POSTS_SECTION_COOKIE)
      captureEvent('communityPostsSectionCollapsed')
    } else {
      setCookie(SHOW_COMMUNITY_POSTS_SECTION_COOKIE, "true", {expires: moment().add(2, 'years').toDate()})
      captureEvent('communityPostsSectionExpanded')
    }
  }

  const { SingleColumnSection, PostsList2, SectionTitle, LWTooltip, ForumIcon, SectionFooter } = Components
  
  const titleNode = <div className={classes.title}>
    Posts tagged community
    <LWTooltip title={sectionExpanded ? 'Collapse' : 'Expand'} hideOnTouchScreens>
      <ForumIcon
        icon={sectionExpanded ? 'ThickChevronDown' : 'ThickChevronRight'}
        onClick={toggleSectionVisibility}
        className={classes.expandIcon}
      />
    </LWTooltip>
  </div>

  const now = moment().tz(timezone)
  const dateCutoff = now.subtract(90, 'days').format("YYYY-MM-DD")

  const recentPostsTerms = {
    view: "magic",
    filterSettings: {tags: [{
      tagId: EA_FORUM_COMMUNITY_TOPIC_ID,
      filterMode: 'Required'
    }]},
    after: dateCutoff,
    limit: 3
  }

  return (
    <AnalyticsContext pageSectionContext="communityPosts">
      <SingleColumnSection>
        <SectionTitle title={titleNode}>
          {sectionExpanded && <Link to="/topics/community" className={classes.readMoreLink}>View more</Link>}
        </SectionTitle>
        {sectionExpanded && <AnalyticsContext listContext={"communityPosts"}>
          <PostsList2 terms={recentPostsTerms} showLoadMore={false} />
        </AnalyticsContext>}
        {sectionExpanded && <SectionFooter>
          <Link to="/topics/community" className={classes.readMoreLinkMobile}>View more</Link>
        </SectionFooter>}
      </SingleColumnSection>
    </AnalyticsContext>
  )
}

const EAHomeCommunityPostsComponent = registerComponent('EAHomeCommunityPosts', EAHomeCommunityPosts, {styles});

declare global {
  interface ComponentTypes {
    EAHomeCommunityPosts: typeof EAHomeCommunityPostsComponent
  }
}
