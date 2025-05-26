import React, { useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useUserLocation } from '../../lib/collections/users/helpers';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { getCityName } from '../localGroups/TabNavigationEventsList';
import { userHasEAHomeRHS } from '../../lib/betas';
import { useRecentOpportunities } from '../hooks/useRecentOpportunities';
import { useEAVirtualPrograms } from '../hooks/useEAVirtualPrograms';
import DeferRender from '../common/DeferRender';
import LWTooltip from "../common/LWTooltip";
import SectionTitle from "../common/SectionTitle";
import PostsItemTooltipWrapper from "../posts/PostsItemTooltipWrapper";
import FormatDate from "../common/FormatDate";
import PostsItemDate from "../posts/PostsItemDate";
import ForumIcon from "../common/ForumIcon";
import SidebarDigestAd from "./digestAd/SidebarDigestAd";
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";

const PostsListMultiQuery = gql(`
  query multiPostEAHomeRightHandSideQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsList
      }
      totalCount
    }
  }
`);

/**
 * The max screen width where the Home RHS is visible
 */
export const HOME_RHS_MAX_SCREEN_WIDTH = 1370

const styles = (theme: ThemeType) => ({
  root: {
    paddingRight: 50,
    marginTop: 10,
    marginLeft: 50,
    [`@media(max-width: ${HOME_RHS_MAX_SCREEN_WIDTH}px)`]: {
      display: 'none'
    }
  },
  sidebarToggle: {
    position: 'absolute',
    right: 0,
    height: 36,
    width: 30,
    backgroundColor: theme.palette.grey[200],
    color: theme.palette.grey[500],
    padding: 9,
    borderRadius: '18px 0 0 18px',
    cursor: 'pointer',
    transition: 'width 0.2s ease',
    '&:hover': {
      width: 34,
      backgroundColor: theme.palette.grey[250],
    },
    [`@media(max-width: ${HOME_RHS_MAX_SCREEN_WIDTH}px)`]: {
      display: 'none'
    }
  },
  sidebarToggleIcon: {
    fontSize: 18
  },
  section: {
    maxWidth: 260,
    display: 'flex',
    flexDirection: 'column',
    rowGap: '9px',
    fontSize: 13,
    fontWeight: 450,
    fontFamily: theme.typography.fontFamily,
    marginBottom: 32,
  },
  digestAd: {
    maxWidth: 280,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    lineHeight: '16px'
  },
  postTitle: {
    fontWeight: 600,
  },
  postTitleLink: {
    display: 'inline-block',
    maxWidth: '100%',
    overflow: 'hidden',
    whiteSpace: "nowrap",
    textOverflow: 'ellipsis',
  },
  postMetadata: {
    color: theme.palette.text.dim3,
  },
  eventDate: {
    display: 'inline-block',
    width: 52
  },
  eventLocation: {
  },
  tooltip: {
    textAlign: "center",
    backgroundColor: `${theme.palette.panelBackground.tooltipBackground2} !important`,
    maxWidth: 156,
  },
  courseLink: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: 6,
    fontWeight: 600,
  },
  courseIcon: {
    height: 16,
    width: 16,
  },
  feedbackLink: {
    color: theme.palette.grey[600],
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 600,
    fontSize: 13,
  },
});


/**
 * This is a list of upcoming (nearby) events. It uses logic similar to EventsList.tsx.
 */
const UpcomingEventsSection = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()
  const {lat, lng, known} = useUserLocation(currentUser, true)
  const upcomingEventsTerms: PostsViewTerms = lat && lng && known ? {
    view: 'nearbyEvents',
    lat: lat,
    lng: lng,
    limit: 3,
  } : {
    view: 'globalEvents',
    limit: 3,
  }
  const { view, limit, ...selectorTerms } = upcomingEventsTerms;
  const { data } = useQuery(PostsListMultiQuery, {
    variables: {
      selector: { [view]: selectorTerms },
      limit: 10,
      enableTotal: false,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const upcomingEvents = data?.posts?.results;
  if (!upcomingEvents?.length) return null

  return <AnalyticsContext pageSubSectionContext="upcomingEvents">
    <div className={classes.section}>
      <LWTooltip
        title="View more events"
        placement="top-start"
        popperClassName={classes.tooltip}
      >
        <SectionTitle
          title="Upcoming events"
          href="/events"
          titleClassName={classes.sectionTitle}
          noTopMargin
          noBottomPadding
        />
      </LWTooltip>
      {upcomingEvents?.map(event => {
        return <div key={event._id}>
          <div className={classes.postTitle}>
            <PostsItemTooltipWrapper post={event} As="span">
              <Link to={postGetPageUrl(event)} className={classes.postTitleLink}>
                {event.title}
              </Link>
            </PostsItemTooltipWrapper>
          </div>
          <div className={classes.postMetadata}>
            <span className={classes.eventDate}>
              {event.startTime && <FormatDate date={event.startTime} format={"MMM D"} />}
            </span>
            <span className={classes.eventLocation}>
              {event.onlineEvent ? "Online" : getCityName(event)}
            </span>
          </div>
        </div>
      })}
    </div>
  </AnalyticsContext>
}

/**
 * This is the primary EA Forum home page right-hand side component.
 */
export const EAHomeRightHandSide = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser()
  const updateCurrentUser = useUpdateCurrentUser()
  const { captureEvent } = useTracking()
  // logged in users can hide the RHS - this is tracked via state so that the UI is snappy
  const [isHidden, setIsHidden] = useState(!!currentUser?.hideHomeRHS)

  const {results: opportunityPosts} = useRecentOpportunities({
    fragmentName: "PostsListWithVotesAndSequence",
  });
  const vpDates = useEAVirtualPrograms()
  
  const handleToggleSidebar = () => {
    if (!currentUser) return
    
    if (isHidden) {
      setIsHidden(false)
      captureEvent("homeRhsShown")
      void updateCurrentUser({hideHomeRHS: false})
    } else {
      setIsHidden(true)
      captureEvent("homeRhsHidden")
      void updateCurrentUser({hideHomeRHS: true})
    }
  }

  if (!userHasEAHomeRHS(currentUser)) return null
  const sidebarToggleNode = <div className={classes.sidebarToggle} onClick={handleToggleSidebar}>
    <LWTooltip title={isHidden ? 'Show sidebar' : 'Hide sidebar'}>
      <ForumIcon icon={isHidden ? 'ThickChevronLeft' : 'ThickChevronRight'} className={classes.sidebarToggleIcon} />
    </LWTooltip>
  </div>
  
  if (isHidden) {
    // We include an empty root here so that when the sidebar is hidden,
    // the center column is slightly closer to the center of the screen.
    return <AnalyticsContext pageSectionContext="homeRhs">
      {sidebarToggleNode}
      <div className={classes.root}></div>
    </AnalyticsContext>
  }
  
  // NoSSR sections that could affect the logged out user cache
  let digestAdNode = <SidebarDigestAd className={classes.digestAd} />
  let upcomingEventsNode = <UpcomingEventsSection classes={classes} />
  if (!currentUser) {
    digestAdNode = <DeferRender ssr={false}>{digestAdNode}</DeferRender>
    upcomingEventsNode = <DeferRender ssr={false}>{upcomingEventsNode}</DeferRender>
  }

  return <AnalyticsContext pageSectionContext="homeRhs">
    {!!currentUser && sidebarToggleNode}
    <div className={classes.root}>
      {digestAdNode}
      
      {!!opportunityPosts?.length && <AnalyticsContext pageSubSectionContext="opportunities">
        <div className={classes.section}>
          <LWTooltip
            title="View more posts tagged “Opportunities to take action”"
            placement="top-start"
            popperClassName={classes.tooltip}
          >
            <SectionTitle
              title="Opportunities"
              href="/topics/opportunities-to-take-action?sortedBy=magic"
              titleClassName={classes.sectionTitle}
              noTopMargin
              noBottomPadding
            />
          </LWTooltip>
          {opportunityPosts?.map(post => <div key={post._id}>
            <div className={classes.postTitle}>
              <PostsItemTooltipWrapper post={post} As="span">
                <Link to={postGetPageUrl(post)} className={classes.postTitleLink}>
                  {post.title}
                </Link>
              </PostsItemTooltipWrapper>
            </div>
            <div className={classes.postMetadata}>
              Posted <PostsItemDate post={post} includeAgo useCuratedDate={false} />
            </div>
          </div>)}
        </div>
      </AnalyticsContext>}
      
      {upcomingEventsNode}
      
      <AnalyticsContext pageSubSectionContext="courses">
        <div className={classes.section}>
          <LWTooltip
            title="View more courses"
            placement="top-start"
            popperClassName={classes.tooltip}
          >
            <SectionTitle
              title="Online courses"
              href="https://www.effectivealtruism.org/virtual-programs?utm_source=ea_forum&utm_medium=rhs&utm_campaign=home_page"
              titleClassName={classes.sectionTitle}
              noTopMargin
              noBottomPadding
            />
          </LWTooltip>
          <div>
            <Link
              to="https://www.effectivealtruism.org/virtual-programs/introductory-program?utm_source=ea_forum&utm_medium=rhs&utm_campaign=home_page"
              className={classes.courseLink}
            >
              <ForumIcon icon="ComputerDesktop" className={classes.courseIcon} />
              The Introductory EA Program
            </Link>
            <div className={classes.postMetadata}>
              Apply by <FormatDate date={vpDates.deadline.toISOString()} format={"MMM D"} tooltip={false} />,
              starting <FormatDate date={vpDates.start.toISOString()} format={"MMM D"} tooltip={false} />
            </div>
          </div>
        </div>
      </AnalyticsContext>

      <a href="mailto:forum@effectivealtruism.org" className={classes.feedbackLink}>
        Send feedback
      </a>
    </div>
  </AnalyticsContext>
}

export default registerComponent('EAHomeRightHandSide', EAHomeRightHandSide, {styles});


