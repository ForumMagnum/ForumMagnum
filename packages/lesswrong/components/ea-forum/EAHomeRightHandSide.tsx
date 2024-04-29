import React, { useState } from 'react';
import classNames from 'classnames';
import sortBy from 'lodash/sortBy';
import findIndex from 'lodash/findIndex';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper';
import { useMulti } from '../../lib/crud/withMulti';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useUserLocation } from '../../lib/collections/users/helpers';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { getCityName } from '../localGroups/TabNavigationEventsList';
import { isPostWithForeignId } from '../hooks/useForeignCrosspost';
import { userHasEAHomeRHS } from '../../lib/betas';
import { useRecentOpportunities } from '../hooks/useRecentOpportunities';
import { podcastPost, podcasts } from '../../lib/eaPodcasts';
import ForumNoSSR from '../common/ForumNoSSR';

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
  podcastsSection: {
    rowGap: '6px',
  },
  digestAd: {
    maxWidth: 280,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    lineHeight: '16px'
  },
  resourceLink: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: 6,
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
  resourceIcon: {
    height: 16,
    width: 16,
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
  podcastApps: {
    display: 'grid',
    gridTemplateColumns: "117px 138px",
    columnGap: 7,
    rowGap: '3px',
    marginLeft: -3,
    marginBottom: 2,
  },
  podcastApp: {
    display: 'flex',
    columnGap: 8,
    alignItems: 'flex-end',
    padding: 6,
    borderRadius: theme.borderRadius.default,
    '&:hover': {
      backgroundColor: theme.palette.grey[200],
      opacity: 1
    }
  },
  podcastAppIcon: {
    color: theme.palette.primary.main,
  },
  listenOn: {
    color: theme.palette.text.dim3,
    fontSize: 9,
    fontWeight: 700,
    textTransform: 'uppercase',
    marginBottom: 2
  },
  podcastAppName: {
    fontSize: 12,
    fontWeight: 600,
  },
  tooltip: {
    textAlign: "center",
    backgroundColor: `${theme.palette.panelBackground.tooltipBackground2} !important`,
    maxWidth: 156,
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
  const { results: upcomingEvents } = useMulti({
    collectionName: "Posts",
    terms: upcomingEventsTerms,
    fragmentName: 'PostsList',
    fetchPolicy: 'cache-and-network',
  })

  const {LWTooltip, SectionTitle, PostsItemTooltipWrapper, FormatDate} = Components;
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
          className={classes.sectionTitle}
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

  const {results: savedPosts} = useMulti({
    collectionName: "Posts",
    terms: {
      view: "myBookmarkedPosts",
      limit: 3,
    },
    fragmentName: "PostsList",
    fetchPolicy: "cache-and-network",
    skip: !currentUser?._id,
  })
  // HACK: The results are not properly sorted, so we sort them here.
  // See also comments in BookmarksList.tsx and the myBookmarkedPosts view.
  const sortedSavedPosts = sortBy(savedPosts,
    post => -findIndex(
      currentUser?.bookmarkedPostsMetadata || [],
      (bookmark) => bookmark.postId === post._id
    )
  )
  
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
  
  const {
    SectionTitle, PostsItemTooltipWrapper, PostsItemDate, LWTooltip, ForumIcon, SidebarDigestAd
  } = Components
  
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
    digestAdNode = <ForumNoSSR>{digestAdNode}</ForumNoSSR>
    upcomingEventsNode = <ForumNoSSR>{upcomingEventsNode}</ForumNoSSR>
  }

  return <AnalyticsContext pageSectionContext="homeRhs">
    {!!currentUser && sidebarToggleNode}
    <div className={classes.root}>
      {digestAdNode}
      
      <AnalyticsContext pageSubSectionContext="resources">
        <div className={classes.section}>
          <SectionTitle title="Resources" className={classes.sectionTitle} noTopMargin noBottomPadding />
          <div>
            <Link to="/handbook" className={classes.resourceLink}>
              <ForumIcon icon="BookOpen" className={classes.resourceIcon} />
              The EA Handbook
            </Link>
          </div>
          <div>
            <Link to="https://www.effectivealtruism.org/virtual-programs/introductory-program" className={classes.resourceLink}>
              <ForumIcon icon="ComputerDesktop" className={classes.resourceIcon} />
              The Introductory EA Program
            </Link>
          </div>
          <div>
            <Link to="/groups" className={classes.resourceLink}>
              <ForumIcon icon="UsersOutline" className={classes.resourceIcon} />
              Discover EA groups
            </Link>
          </div>
        </div>
      </AnalyticsContext>
      
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
              className={classes.sectionTitle}
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
      
      {!!sortedSavedPosts?.length && <AnalyticsContext pageSubSectionContext="savedPosts">
        <div className={classes.section}>
          <SectionTitle
            title="Saved posts"
            href="/saved"
            className={classes.sectionTitle}
            noTopMargin
            noBottomPadding
          />
          {sortedSavedPosts.map(post => {
            let postAuthor = '[anonymous]'
            if (post.user && !post.hideAuthor) {
              postAuthor = post.user.displayName
            }
            const readTime = isPostWithForeignId(post) ? '' : `, ${post.readTimeMinutes} min`
            return <div key={post._id}>
              <div className={classes.postTitle}>
                <PostsItemTooltipWrapper post={post} As="span">
                  <Link to={postGetPageUrl(post)} className={classes.postTitleLink}>
                    {post.title}
                  </Link>
                </PostsItemTooltipWrapper>
              </div>
              <div className={classes.postMetadata}>
                {postAuthor}{readTime}
              </div>
            </div>
          })}
        </div>
      </AnalyticsContext>}
      
      <AnalyticsContext pageSubSectionContext="podcasts">
        <div className={classNames(classes.section, classes.podcastsSection)}>
          <SectionTitle
            title="Listen to posts anywhere"
            href={podcastPost}
            className={classes.sectionTitle}
            noTopMargin
            noBottomPadding
          />
          <div className={classes.podcastApps}>
            {podcasts.map(podcast => <Link key={podcast.name} to={podcast.url} target="_blank" rel="noopener noreferrer" className={classes.podcastApp}>
                <div className={classes.podcastAppIcon}>{podcast.icon}</div>
                <div>
                  <div className={classes.listenOn}>Listen on</div>
                  <div className={classes.podcastAppName}>{podcast.name}</div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </AnalyticsContext>

      <a href="mailto:forum@effectivealtruism.org" className={classes.feedbackLink}>
        Send feedback
      </a>
    </div>
  </AnalyticsContext>
}

const EAHomeRightHandSideComponent = registerComponent('EAHomeRightHandSide', EAHomeRightHandSide, {styles});

declare global {
  interface ComponentTypes {
    EAHomeRightHandSide: typeof EAHomeRightHandSideComponent
  }
}
