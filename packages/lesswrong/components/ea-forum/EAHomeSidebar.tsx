import React, { useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { Link } from '../../lib/reactRouterWrapper';
import { useMulti } from '../../lib/crud/withMulti';
import { useTimezone } from '../common/withTimezone';
import moment from 'moment';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { getCityName } from '../localGroups/TabNavigationEventsList';
import { spotifyLogoIcon } from '../icons/SpotifyLogoIcon';
import { applePodcastsLogoIcon } from '../icons/ApplePodcastsLogoIcon';
import { overcastLogoIcon } from '../icons/OvercastLogoIcon';
import { googlePodcastsLogoIcon } from '../icons/GooglePodcastsLogoIcon';
import { useCurrentUser } from '../common/withUser';
import { getPostAuthors } from '../../lib/collections/digests/helpers';
import { isPostWithForeignId } from '../hooks/useForeignCrosspost';
import { eaForumDigestSubscribeURL } from '../recentDiscussion/RecentDiscussionSubscribeReminder';
import TextField from '@material-ui/core/TextField';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useMessages } from '../common/withMessages';
import { useUserLocation } from '../../lib/collections/users/helpers';
import sortBy from 'lodash/sortBy';
import findIndex from 'lodash/findIndex';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    minHeight: 250,
    maxWidth: 390,
    paddingLeft: 40,
    paddingRight: 10,
    borderLeft: theme.palette.border.faint,
    marginTop: 30,
    marginLeft: 50
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '9px',
    fontSize: 13,
    // lineHeight: '18px',
    fontFamily: theme.typography.fontFamily,
    marginBottom: 30,
  },
  digestAd: {
    maxWidth: 334,
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
    marginBottom: 12
  },
  digestForm: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    columnGap: 8,
    rowGap: '8px'
  },
  digestFormInput: {
    flexGrow: 1,
    background: theme.palette.grey[0],
    borderRadius: 4,
    '& .MuiInputLabel-outlined': {
      transform: 'translate(14px,12px) scale(1)',
      '&.MuiInputLabel-shrink': {
        transform: 'translate(14px,-6px) scale(0.75)',
      }
    },
    '& .MuiOutlinedInput-input': {
      padding: 10
    }
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
  icon: {
    height: 16,
    width: 16,
  },
  postTitle: {
    fontWeight: 600,
    // marginBottom: 1
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
    '& .PostsItemDate-postedAt': {
      fontWeight: 400
    }
  },
  eventDate: {
    display: 'inline-block',
    width: 64
  },
  eventLocation: {
  },
  viewMore: {
    fontWeight: 600,
    color: theme.palette.text.dim3
  },
  podcastApps: {
    display: 'grid',
    gridTemplateColumns: "100px 150px",
    rowGap: '14px',
  },
  podcastApp: {
    display: 'flex',
    columnGap: 8,
    alignItems: 'flex-end',
  },
  podcastAppIcon: {
    color: theme.palette.primary.main,
  },
  listenOn: {
    color: theme.palette.text.dim3,
    fontSize: 9,
    fontWeight: 600,
    textTransform: 'uppercase',
    marginBottom: 2
  },
  podcastAppName: {
    fontSize: 12,
    fontWeight: 600,
  }
});

const DigestAd = ({classes}: {
  classes: ClassesType,
}) => {
  const updateCurrentUser = useUpdateCurrentUser()
  const [loading, setLoading] = useState(false)
  const { flash } = useMessages()
  
  const handleSubscribe = async () => {
    setLoading(true)
    try {
      await updateCurrentUser({
        subscribedToDigest: true,
        unsubscribeFromAll: false
      })
      flash('Thanks for subscribing!')
    } catch(e) {
      flash('There was a problem subscribing you to the digest. Please try again later.')
    }
    setLoading(false)
  }
  
  const { ForumIcon, EAButton } = Components
  
  return <div className={classes.digestAd}>
    <div className={classes.digestAdHeadingRow}>
      <h2 className={classes.digestAdHeading}>Get the best posts in your email</h2>
      <ForumIcon icon="Close" className={classes.digestAdClose} />
    </div>
    <div className={classes.digestAdBody}>
      Sign up for the EA Forum Digest to get curated recommendations every week
    </div>
    <form action={eaForumDigestSubscribeURL} method="post" className={classes.digestForm}>
      <TextField variant="outlined" label="Email address" placeholder="example@email.com" name="EMAIL" required className={classes.digestFormInput} />
      <EAButton className={classes.digestFormSubmitBtn}>
        Subscribe
      </EAButton>
    </form>
  </div>
}

export const EAHomeSidebar = ({classes}: {
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser()
  const { captureEvent } = useTracking()
  const { timezone } = useTimezone()

  const now = moment().tz(timezone)
  const dateCutoff = now.subtract(7, 'days').format("YYYY-MM-DD")
  const { results: opportunityPosts } = useMulti({
    collectionName: "Posts",
    terms: {
      view: "magic",
      filterSettings: {tags: [{
        tagId: 'uRdzfbywnyQ6JkJqK', // TODO replace
        filterMode: 'Required'
      }]},
      after: dateCutoff,
      limit: 3
    },
    fragmentName: "PostsBase",
    enableTotal: false,
    fetchPolicy: "cache-and-network",
  })
  
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
    fragmentName: 'PostsBase',
    fetchPolicy: 'cache-and-network',
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
  // See also comments in the myBookmarkedPosts view.
  const sortedSavedPosts = sortBy(savedPosts,
    post => -findIndex(
      currentUser?.bookmarkedPostsMetadata || [],
      (bookmark) => bookmark.postId === post._id
    )
  )
  
  const { SectionTitle, PostsItemDate, PostsAuthors, ForumIcon } = Components
  
  const podcastPost = 'https://forum.effectivealtruism.org/posts/K5Snxo5EhgmwJJjR2/announcing-ea-forum-podcast-audio-narrations-of-ea-forum'

  return <div className={classes.root}>
    <div className={classes.section}>
      <DigestAd classes={classes} />
    </div>
    <div className={classes.section}>
      <SectionTitle title="Resources" className={classes.sectionTitle} noTopMargin noBottomPadding />
      <div>
        <Link to="/handbook" className={classes.resourceLink}>
          <ForumIcon icon="BookOpen" className={classes.icon} />
          The EA Handbook
        </Link>
      </div>
      <div>
        <Link to="https://www.effectivealtruism.org/virtual-programs/introductory-program" className={classes.resourceLink}>
          <ForumIcon icon="ComputerDesktop" className={classes.icon} />
          The Introductory EA Program
        </Link>
      </div>
      <div>
        <Link to="/groups" className={classes.resourceLink}>
          <ForumIcon icon="Users" className={classes.icon} />
          Discover EA groups
        </Link>
      </div>
    </div>
    
    <div className={classes.section}>
      <SectionTitle title="Opportunities" className={classes.sectionTitle} noTopMargin noBottomPadding />
      {opportunityPosts?.map(post => <div key={post._id} className={classes.post}>
        <div className={classes.postTitle}>
          <Link to={postGetPageUrl(post)} className={classes.postTitleLink}>
            {post.title}
          </Link>
        </div>
        <div className={classes.postMetadata}>
          Posted <PostsItemDate post={post} includeAgo />
        </div>
      </div>)}
      <div>
        <Link to="/topics/take-action" className={classes.viewMore}>View more</Link>
      </div>
    </div>
    
    <div className={classes.section}>
      <SectionTitle title="Upcoming events" className={classes.sectionTitle} noTopMargin noBottomPadding />
      {upcomingEvents?.map(event => {
        const shortDate = moment(event.startTime).tz(timezone).format("MMM D")
        return <div key={event._id} className={classes.post}>
          <div className={classes.postTitle}>
            <Link to={postGetPageUrl(event)} className={classes.postTitleLink}>
              {event.title}
            </Link>
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
      <div>
        <Link to="/events" className={classes.viewMore}>View more</Link>
      </div>
    </div>
    
    {sortedSavedPosts && sortedSavedPosts.length > 0 && <div className={classes.section}>
      <SectionTitle title="Saved posts" className={classes.sectionTitle} noTopMargin noBottomPadding />
      {sortedSavedPosts.map(post => {
        let postAuthor = '[anonymous]'
        if (post.user && !post.hideAuthor) {
          postAuthor = post.user.displayName
        }
        const readTime = isPostWithForeignId(post) ? '' : `, ${post.readTimeMinutes} min`
        return <div key={post._id} className={classes.post}>
          <div className={classes.postTitle}>
            <Link to={postGetPageUrl(post)} className={classes.postTitleLink}>
              {post.title}
            </Link>
          </div>
          <div className={classes.postMetadata}>
            {/* <PostsAuthors post={post} /> TODO figure out what to do here */}
            {postAuthor}{readTime}
          </div>
        </div>
      })}
      <div>
        <Link to="/saved" className={classes.viewMore}>View more</Link>
      </div>
    </div>}
    
    <div className={classes.section}>
      <SectionTitle title="Listen to posts anywhere" className={classes.sectionTitle} noTopMargin noBottomPadding />
      <div className={classes.podcastApps}>
        <a href="https://open.spotify.com/show/2Ki0q34zEthDfKUB56kcxH" target="_blank" rel="noopener noreferrer" className={classes.podcastApp}>
          <div className={classes.podcastAppIcon}>{spotifyLogoIcon}</div>
          <div>
            <div className={classes.listenOn}>Listen on</div>
            <div className={classes.podcastAppName}>Spotify</div>
          </div>
        </a>
        <a href="https://podcasts.apple.com/us/podcast/1657526204" target="_blank" rel="noopener noreferrer" className={classes.podcastApp}>
          <div className={classes.podcastAppIcon}>{applePodcastsLogoIcon}</div>
          <div>
            <div className={classes.listenOn}>Listen on</div>
            <div className={classes.podcastAppName}>Apple Podcasts</div>
          </div>
        </a>
        <a href="https://overcast.fm/itunes1657526204" target="_blank" rel="noopener noreferrer" className={classes.podcastApp}>
          <div className={classes.podcastAppIcon}>{overcastLogoIcon}</div>
          <div>
            <div className={classes.listenOn}>Listen on</div>
            <div className={classes.podcastAppName}>Overcast</div>
          </div>
        </a>
        <a
          href="https://podcasts.google.com/feed/aHR0cHM6Ly9mb3J1bS1wb2RjYXN0cy5lZmZlY3RpdmVhbHRydWlzbS5vcmcvZWEtZm9ydW0tLWFsbC1hdWRpby5yc3M"
          target="_blank" rel="noopener noreferrer"
          className={classes.podcastApp}
        >
          <div className={classes.podcastAppIcon}>{googlePodcastsLogoIcon}</div>
          <div>
            <div className={classes.listenOn}>Listen on</div>
            <div className={classes.podcastAppName}>Google Podcasts</div>
          </div>
        </a>
      </div>
      <div>
        <Link to={podcastPost} className={classes.viewMore}>View more</Link>
      </div>
    </div>
  </div>
}

const EAHomeSidebarComponent = registerComponent('EAHomeSidebar', EAHomeSidebar, {styles});

declare global {
  interface ComponentTypes {
    EAHomeSidebar: typeof EAHomeSidebarComponent
  }
}
