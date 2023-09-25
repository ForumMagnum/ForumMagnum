import React, { useRef, useState } from 'react';
import NoSSR from 'react-no-ssr';
import moment from 'moment';
import classNames from 'classnames';
import sortBy from 'lodash/sortBy';
import findIndex from 'lodash/findIndex';
import TextField from '@material-ui/core/TextField';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { AnalyticsContext, useTracking } from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper';
import { useMulti } from '../../lib/crud/withMulti';
import { useTimezone } from '../common/withTimezone';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useMessages } from '../common/withMessages';
import { useUserLocation, userHasEmailAddress } from '../../lib/collections/users/helpers';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { getCityName } from '../localGroups/TabNavigationEventsList';
import { isPostWithForeignId } from '../hooks/useForeignCrosspost';
import { eaForumDigestSubscribeURL } from '../recentDiscussion/RecentDiscussionSubscribeReminder';
import { EA_FORUM_HEADER_HEIGHT } from '../common/Header';
import { userHasEAHomeRHS } from '../../lib/betas';
import { spotifyLogoIcon } from '../icons/SpotifyLogoIcon';
import { pocketCastsLogoIcon } from '../icons/PocketCastsLogoIcon';
import { applePodcastsLogoIcon } from '../icons/ApplePodcastsLogoIcon';
import { googlePodcastsLogoIcon } from '../icons/GooglePodcastsLogoIcon';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';


const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingLeft: 40,
    paddingRight: 50,
    marginTop: 30,
    marginLeft: 50,
    '@media(max-width: 1370px)': {
      display: 'none'
    }
  },
  sidebarToggle: {
    position: 'absolute',
    top: 30,
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
    '@media(max-width: 1370px)': {
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
  digestAdSection: {
    maxWidth: 334,
  },
  podcastsSection: {
    rowGap: '6px',
  },
  digestAd: {
    backgroundColor: theme.palette.grey[200],
    padding: '12px 16px',
    borderRadius: theme.borderRadius.default
  },
  digestAdHeadingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    columnGap: 8,
    marginBottom: 12
  },
  digestAdHeading: {
    fontWeight: 600,
    fontSize: 16,
    margin: 0
  },
  digestAdClose: {
    height: 16,
    width: 16,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[800],
    }
  },
  digestAdBody: {
    fontSize: 13,
    lineHeight: '19px',
    fontWeight: 500,
    color: theme.palette.grey[600],
    marginBottom: 15
  },
  digestForm: {
    display: 'flex',
    alignItems: 'baseline',
    columnGap: 8,
    rowGap: '12px'
  },
  digestFormInput: {
    flexGrow: 1,
    background: theme.palette.grey[0],
    borderRadius: theme.borderRadius.default,
    '& .MuiInputLabel-outlined': {
      transform: 'translate(14px,12px) scale(1)',
      '&.MuiInputLabel-shrink': {
        transform: 'translate(14px,-6px) scale(0.75)',
      }
    },
    '& .MuiNotchedOutline-root': {
      borderRadius: theme.borderRadius.default,
    },
    '& .MuiOutlinedInput-input': {
      padding: 11
    }
  },
  digestFormBtnWideScreen: {
    '@media(max-width: 1450px)': {
      display: 'none'
    }
  },
  digestFormBtnNarrowScreen: {
    display: 'none',
    '@media(max-width: 1450px)': {
      display: 'inline'
    }
  },
  digestFormBtnArrow: {
    transform: 'translateY(3px)',
    fontSize: 16
  },
  digestSuccess: {
    display: 'flex',
    columnGap: 10,
    fontSize: 13,
    lineHeight: '19px',
    color: theme.palette.grey[800],
  },
  digestSuccessCheckIcon: {
    color: theme.palette.icon.greenCheckmark
  },
  digestSuccessLink: {
    color: theme.palette.primary.main
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
 * This is the Forum Digest ad that appears at the top of the EA Forum home page right hand side.
 * It has some overlap with the Forum Digest ad that appears in "Recent discussion".
 * In particular, both components use currentUser.hideSubscribePoke,
 * so for logged in users, hiding one ad hides the other.
 *
 * See RecentDiscussionSubscribeReminder.tsx for the other component.
 */
const DigestAd = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const updateCurrentUser = useUpdateCurrentUser()
  const emailRef = useRef<HTMLInputElement|null>(null)
  const ls = getBrowserLocalStorage()
  const [isHidden, setIsHidden] = useState(
    // logged out user clicked the X in this ad, or previously submitted the form
    (!currentUser && ls?.getItem('hideHomeDigestAd')) ||
    // user is already subscribed
    currentUser?.subscribedToDigest ||
    // user is logged in and clicked the X in this ad, or "Don't ask again" in the ad in "Recent discussion"
    currentUser?.hideSubscribePoke
  )
  const [loading, setLoading] = useState(false)
  const [subscribeClicked, setSubscribeClicked] = useState(false)
  const { flash } = useMessages()
  const { captureEvent } = useTracking()
  
  // This should never happen, but just exit if it does.
  if (!currentUser && !ls) return null
  
  // If the user just submitted the form, make sure not to hide it, so that it properly finishes submitting.
  // Alternatively, if the logged in user just clicked "Subscribe", show the success text rather than hiding this.
  if (isHidden && !subscribeClicked) return null
  
  // If the user is logged in and has an email address, we show their email address and the "Subscribe" button.
  // Otherwise, we show the form with the email address input.
  const showForm = !currentUser || !userHasEmailAddress(currentUser)
  
  const handleClose = () => {
    setIsHidden(true)
    captureEvent("digestAdClosed")
    if (currentUser) {
      void updateCurrentUser({hideSubscribePoke: true})
    } else {
      ls.setItem('hideHomeDigestAd', true)
    }
  }
  
  const handleUserSubscribe = async () => {
    setLoading(true)
    setSubscribeClicked(true)
    captureEvent("digestAdSubscribed")
    
    if (currentUser) {
      try {
        await updateCurrentUser({
          subscribedToDigest: true,
          unsubscribeFromAll: false
        })
      } catch(e) {
        flash('There was a problem subscribing you to the digest. Please try again later.')
      }
    }
    if (showForm && emailRef.current?.value) {
      ls.setItem('hideHomeDigestAd', true)
    }
    
    setLoading(false)
  }
  
  const { ForumIcon, EAButton } = Components
  
  const buttonProps = loading ? {disabled: true} : {}
  // button either says "Subscribe" or has a right arrow depending on the screen width
  const buttonContents = <>
    <span className={classes.digestFormBtnWideScreen}>Subscribe</span>
    <span className={classes.digestFormBtnNarrowScreen}>
      <ForumIcon icon="ArrowRight" className={classes.digestFormBtnArrow} />
    </span>
  </>
  
  // Show the form to submit to Mailchimp directly,
  // or display the logged in user's email address and the Subscribe button
  let formNode = showForm ? (
    <form action={eaForumDigestSubscribeURL} method="post" className={classes.digestForm}>
      <TextField
        inputRef={emailRef}
        variant="outlined"
        label="Email address"
        placeholder="example@email.com"
        name="EMAIL"
        required
        className={classes.digestFormInput}
      />
      <EAButton type="submit" onClick={handleUserSubscribe} {...buttonProps}>
        {buttonContents}
      </EAButton>
    </form>
  ) : (
    <div className={classes.digestForm}>
      <TextField
        variant="outlined"
        value={currentUser.email}
        className={classes.digestFormInput}
        disabled={true}
      />
      <EAButton onClick={handleUserSubscribe} {...buttonProps}>
        {buttonContents}
      </EAButton>
    </div>
  )
  
  // If a logged in user with an email address subscribes, show the success message.
  if (!showForm && subscribeClicked) {
    formNode = <div className={classes.digestSuccess}>
      <ForumIcon icon="CheckCircle" className={classes.digestSuccessCheckIcon} />
      <div>
        Thanks for subscribing! You can edit your subscription via
        your <Link to={'/account?highlightField=subscribedToDigest'} className={classes.digestSuccessLink}>
          account settings
        </Link>.
      </div>
    </div>
  }
  
  return <AnalyticsContext pageSubSectionContext="digestAd">
    <div className={classNames(classes.section, classes.digestAdSection)}>
      <div className={classes.digestAd}>
        <div className={classes.digestAdHeadingRow}>
          <h2 className={classes.digestAdHeading}>Get the best posts in your email</h2>
          <ForumIcon icon="Close" className={classes.digestAdClose} onClick={handleClose} />
        </div>
        <div className={classes.digestAdBody}>
          Sign up for the EA Forum Digest to get curated recommendations every week
        </div>
        {formNode}
      </div>
    </div>
  </AnalyticsContext>
}

/**
 * This is a list of upcoming (nearby) events. It uses logic similar to EventsList.tsx.
 */
const UpcomingEventsSection = ({classes}: {
  classes: ClassesType,
}) => {
  const { timezone } = useTimezone()
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

  const {LWTooltip, SectionTitle, PostsItemTooltipWrapper} = Components;
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
        const shortDate = moment(event.startTime).tz(timezone).format("MMM D")
        return <div key={event._id} className={classes.post}>
          <div className={classes.postTitle}>
            <PostsItemTooltipWrapper post={event} As="span">
              <Link to={postGetPageUrl(event)} className={classes.postTitleLink}>
                {event.title}
              </Link>
            </PostsItemTooltipWrapper>
          </div>
          <div className={classes.postMetadata}>
            <span className={classes.eventDate}>
              {shortDate}
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
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const updateCurrentUser = useUpdateCurrentUser()
  const { captureEvent } = useTracking()
  const { timezone } = useTimezone()
  // logged in users can hide the RHS - this is tracked via state so that the UI is snappy
  const [isHidden, setIsHidden] = useState(!!currentUser?.hideHomeRHS)

  const now = moment().tz(timezone)
  const dateCutoff = now.subtract(7, 'days').format("YYYY-MM-DD")
  const { results: opportunityPosts } = useMulti({
    collectionName: "Posts",
    terms: {
      view: "magic",
      filterSettings: {tags: [{
        tagId: 'z8qFsGt5iXyZiLbjN',
        filterMode: 'Required'
      }]},
      after: dateCutoff,
      limit: 3
    },
    fragmentName: "PostsList",
    enableTotal: false,
    fetchPolicy: "cache-and-network",
  })
  
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
  
  // Currently, this is only visible to beta users.
  if (!userHasEAHomeRHS(currentUser)) return null
  
  const { SectionTitle, PostsItemTooltipWrapper, PostsItemDate, LWTooltip, ForumIcon } = Components
  
  const sidebarToggleNode = <div className={classes.sidebarToggle} onClick={handleToggleSidebar}>
    <LWTooltip title={isHidden ? 'Show sidebar' : 'Hide sidebar'}>
      <ForumIcon icon={isHidden ? 'ThickChevronLeft' : 'ThickChevronRight'} className={classes.sidebarToggleIcon} />
    </LWTooltip>
  </div>
  
  if (isHidden) return sidebarToggleNode
  
  // NoSSR sections that could affect the logged out user cache
  let digestAdNode = <DigestAd classes={classes} />
  let upcomingEventsNode = <UpcomingEventsSection classes={classes} />
  if (!currentUser) {
    digestAdNode = <NoSSR>{digestAdNode}</NoSSR>
    upcomingEventsNode = <NoSSR>{upcomingEventsNode}</NoSSR>
  }

  // data for podcasts section
  const podcasts = [{
    url: 'https://open.spotify.com/show/3NwXq1GGCveAbeH1Sk3yNq',
    icon: spotifyLogoIcon,
    name: 'Spotify'
  }, {
    url: 'https://podcasts.apple.com/us/podcast/1657526204',
    icon: applePodcastsLogoIcon,
    name: 'Apple Podcasts'
  }, {
    url: 'https://pca.st/zlt4n89d',
    icon: pocketCastsLogoIcon,
    name: 'Pocket Casts'
  }, {
    url: 'https://podcasts.google.com/feed/aHR0cHM6Ly9mb3J1bS1wb2RjYXN0cy5lZmZlY3RpdmVhbHRydWlzbS5vcmcvZWEtZm9ydW0tLWFsbC1hdWRpby5yc3M',
    icon: googlePodcastsLogoIcon,
    name: 'Google Podcasts'
  }]
  const podcastPost = '/posts/K5Snxo5EhgmwJJjR2/announcing-ea-forum-podcast-audio-narrations-of-ea-forum'

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
              href="/topics/opportunities-to-take-action"
              className={classes.sectionTitle}
              noTopMargin
              noBottomPadding
            />
          </LWTooltip>
          {opportunityPosts?.map(post => <div key={post._id} className={classes.post}>
            <div className={classes.postTitle}>
              <PostsItemTooltipWrapper post={post} As="span">
                <Link to={postGetPageUrl(post)} className={classes.postTitleLink}>
                  {post.title}
                </Link>
              </PostsItemTooltipWrapper>
            </div>
            <div className={classes.postMetadata}>
              Posted <PostsItemDate post={post} includeAgo />
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
            return <div key={post._id} className={classes.post}>
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

      <Link to="/#" className={classes.feedbackLink}>
        Send feedback
      </Link>
    </div>
  </AnalyticsContext>
}

const EAHomeRightHandSideComponent = registerComponent('EAHomeRightHandSide', EAHomeRightHandSide, {styles});

declare global {
  interface ComponentTypes {
    EAHomeRightHandSide: typeof EAHomeRightHandSideComponent
  }
}
