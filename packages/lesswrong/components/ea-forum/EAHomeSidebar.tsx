import React from 'react';
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

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    minHeight: 250,
    paddingLeft: 40,
    borderLeft: theme.palette.border.normal,
    marginTop: 30,
    marginLeft: 50
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: '10px',
    fontSize: 13,
    // lineHeight: '18px',
    fontFamily: theme.typography.fontFamily,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12
  },
  resourceLink: {
    color: theme.palette.primary.main,
    fontWeight: 600,
  },
  postTitle: {
    fontWeight: 600,
    marginBottom: 1
  },
  postTitleLink: {
    display: 'inline-block',
    maxWidth: '100%',
    overflow: 'hidden',
    whiteSpace: "nowrap",
    textOverflow: 'ellipsis',
  },
  postMetadata: {
    color: theme.palette.text.dim3
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
  
  const { results: upcomingEvents } = useMulti({
    collectionName: "Posts",
    terms: {
      view: 'nearbyEvents',
      limit: 3,
    },
    fragmentName: 'PostsBase',
    enableTotal: false,
    fetchPolicy: 'cache-and-network',
  })
  
  const {results: savedPosts} = useMulti({
    collectionName: "Posts",
    terms: {
      view: "myBookmarkedPosts",
      limit: 3,
    },
    fragmentName: "PostsListBase",
    fetchPolicy: "cache-and-network",
    skip: !currentUser?._id,
  })
  
  const { SectionTitle, PostsItemDate, PostsAuthors } = Components
  
  const podcastPost = 'https://forum.effectivealtruism.org/posts/K5Snxo5EhgmwJJjR2/announcing-ea-forum-podcast-audio-narrations-of-ea-forum'

  return <div className={classes.root}>
    <div className={classes.section}>
      <SectionTitle title="Resources" className={classes.sectionTitle} noTopMargin noBottomPadding />
      <Link to="/handbook" className={classes.resourceLink}>
        The EA Handbook
      </Link>
      <Link to="https://www.effectivealtruism.org/virtual-programs/introductory-program" className={classes.resourceLink}>
        The Introductory EA Program
      </Link>
      <Link to="/groups" className={classes.resourceLink}>
        Discover EA groups
      </Link>
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
    
    <div className={classes.section}>
      <SectionTitle title="Unread saved posts" className={classes.sectionTitle} noTopMargin noBottomPadding />
      {savedPosts?.map(post => <div key={post._id} className={classes.post}>
        <div className={classes.postTitle}>
          <Link to={postGetPageUrl(post)} className={classes.postTitleLink}>
            {post.title}
          </Link>
        </div>
        <div className={classes.postMetadata}>
          <PostsAuthors post={post} />
        </div>
      </div>)}
      <div>
        <Link to="/saved" className={classes.viewMore}>View more</Link>
      </div>
    </div>
    
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
