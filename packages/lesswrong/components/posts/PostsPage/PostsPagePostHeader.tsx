import React, { useState } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { postGetCommentCountStr } from '../../../lib/collections/posts/helpers';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { extractVersionsFromSemver } from '../../../lib/editor/utils'
import { getUrlClass } from '../../../lib/routeUtil';
import classNames from 'classnames';
import { isClient, isServer } from '../../../lib/executionEnvironment';
import HeadsetIcon from '@material-ui/icons/Headset';
import NoSSR from '@material-ui/core/NoSsr';
import { applePodcastIcon } from '../../icons/ApplePodcastIcon';
import { spotifyPodcastIcon } from '../../icons/SpotifyPodcastIcon';

const SECONDARY_SPACING = 20

const styles = (theme: ThemeType): JssStyles => ({
  header: {
    position: 'relative',
    display:"flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.unit*2
  },
  headerLeft: {
    width:"100%"
  },
  headerVote: {
    textAlign: 'center',
    fontSize: 42,
    position: "relative",
  },
  eventHeader: {
    marginBottom:0,
  },
  secondaryInfo: {
    fontSize: '1.4rem',
    fontFamily: theme.typography.uiSecondary.fontFamily,
  },
  groupLinks: {
    display: 'inline-block',
    marginRight: 20
  },
  commentsLink: {
    marginRight: SECONDARY_SPACING,
    color: theme.palette.text.dim3,
    whiteSpace: "no-wrap",
    display: "inline-block",
    fontSize: theme.typography.body2.fontSize,
    "@media print": { display: "none" },
  },
  wordCount: {
    display: 'inline-block',
    marginRight: SECONDARY_SPACING,
    color: theme.palette.text.dim3,
    whiteSpace: "no-wrap",
    fontSize: theme.typography.body2.fontSize,
    "@media print": { display: "none" },
  },
  podcast: {
    marginRight: SECONDARY_SPACING,
    verticalAlign: 'middle',
    color: theme.palette.icon.dim600,
    height: '24px'
  },
  actions: {
    display: 'inline-block',
    color: theme.palette.icon.dim600,
    "@media print": { display: "none" },
  },
  authors: {
    display: 'inline-block',
    marginRight: SECONDARY_SPACING
  },
  feedName: {
    fontSize: theme.typography.body2.fontSize,
    marginRight: SECONDARY_SPACING,
    display: 'inline-block',
    color: theme.palette.text.dim3,
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  date: {
    marginRight: SECONDARY_SPACING,
    display: 'inline-block',
  },
  divider: {
    marginTop: theme.spacing.unit*2,
    marginLeft:0,
    borderTop: theme.palette.border.faint,
    borderLeft: 'transparent'
  },
  embeddedPlayer: {
    marginBottom: '2px'
  },
  hideEmbeddedPlayer: {
    display: "none"
  },
  podcastIconList: {
    paddingLeft: '0px',
    marginTop: '0px'
  },
  podcastIcon: {
    display: 'inline-block',
    marginRight: '8px'
  }
});

// On the server, use the 'url' library for parsing hostname out of feed URLs.
// On the client, we instead create an <a> tag, set its href, and extract
// properties from that. (There is a URL class which theoretically would work,
// but it doesn't have the hostname field on IE11 and it's missing entirely on
// Opera Mini.)
const URLClass = getUrlClass()

function getProtocol(url: string): string {
  if (isServer)
    return new URLClass(url).protocol;

  // From https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
  var parser = document.createElement('a');
  parser.href = url;
  return parser.protocol;
}

function getHostname(url: string): string {
  if (isServer)
    return new URLClass(url).hostname;

  // From https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
  var parser = document.createElement('a');
  parser.href = url;
  return parser.hostname;
}



/// PostsPagePostHeader: The metadata block at the top of a post page, with
/// title, author, voting, an actions menu, etc.
const PostsPagePostHeader = ({post, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  classes: ClassesType,
}) => {
  const {PostsPageTitle, PostsAuthors, LWTooltip, PostsPageDate,
    PostsPageActions, PostsVote, PostsGroupDetails, PostsTopSequencesNav,
    PostsPageEventData, FooterTagList, AddToCalendarButton, PostsPageTopTag} = Components;

  const [showEmbeddedPlayer, setShowEmbeddedPlayer] = useState(false);
  const embedScriptFunction = (src: string, clientWindow: Window & typeof globalThis, clientDocument: Document) => <script>{
    function(p,l,a,y,s?: HTMLScriptElement) {
      if(p[a]) return;
      if(p[y]) return p[y]();
      s=l.createElement('script');
      l.head.appendChild((
        s.async=p[a]=true,
        s.src=src,
        s
      ));
    }(clientWindow,clientDocument,'__btL','__btR')
  }</script>;
  
  const feedLinkDescription = post.feed?.url && getHostname(post.feed.url)
  const feedLink = post.feed?.url && `${getProtocol(post.feed.url)}//${getHostname(post.feed.url)}`;
  const { major } = extractVersionsFromSemver(post.version)
  const hasMajorRevision = major > 1
  const wordCount = post.contents?.wordCount || 0
  const { podcastEpisode } = post

  return <>
    {post.group && <PostsGroupDetails post={post} documentId={post.group._id} />}
    <AnalyticsContext pageSectionContext="topSequenceNavigation">
      <PostsTopSequencesNav post={post} />
    </AnalyticsContext>
    {!post.group && !post.sequence && !post.question && <PostsPageTopTag post={post} />}
    
    <div className={classNames(classes.header, {[classes.eventHeader]:post.isEvent})}>
      <div className={classes.headerLeft}>
        <PostsPageTitle post={post} />
        <div className={classes.secondaryInfo}>
          <span className={classes.authors}>
            <PostsAuthors post={post}/>
          </span>
          { post.feed && post.feed.user &&
            <LWTooltip title={`Crossposted from ${feedLinkDescription}`}>
              <a href={feedLink} className={classes.feedName}>
                {post.feed.nickname}
              </a>
            </LWTooltip>
          }
          {/* NB: Currently display:none'd */}
          {!!wordCount && !post.isEvent && <LWTooltip title={`${wordCount} words`}>
            <span className={classes.wordCount}>{Math.floor(wordCount/200) || 1 } min read</span>
          </LWTooltip>}
          {!post.isEvent && <span className={classes.date}>
            <PostsPageDate post={post} hasMajorRevision={hasMajorRevision} />
          </span>}
          {post.isEvent && <div className={classes.groupLinks}>
            <Components.GroupLinks document={post} noMargin={true} />
          </div>}
          <a className={classes.commentsLink} href={"#comments"}>{ postGetCommentCountStr(post)}</a>
          {podcastEpisode && <LWTooltip title={'Listen to this post'} className={classes.podcast}>
              <a href="#" onClick={() => setShowEmbeddedPlayer(!showEmbeddedPlayer)}><HeadsetIcon/></a>
          </LWTooltip>}
          <div className={classes.commentsLink}>
            <AddToCalendarButton post={post} label="Add to Calendar" hideTooltip={true} />
          </div>
          <span className={classes.actions}>
            <AnalyticsContext pageElementContext="tripleDotMenu">
              <PostsPageActions post={post} />
            </AnalyticsContext>
          </span>
        </div>
      </div>
      {!post.shortform && <div className={classes.headerVote}>
        <PostsVote post={post} />
      </div>}
    </div>
    {podcastEpisode && <div className={classNames({ [classes.hideEmbeddedPlayer]: !showEmbeddedPlayer })}>
      {isClient && <NoSSR>
        <div
          id={`buzzsprout-player-${podcastEpisode.externalEpisodeId}`}
          className={classes.embeddedPlayer}
        />
        {embedScriptFunction(podcastEpisode.episodeLink, window, document)}
      </NoSSR>}
      <ul className={classes.podcastIconList}>
        {podcastEpisode.podcast.applePodcastLink && <li className={classes.podcastIcon}><a href={podcastEpisode.podcast.applePodcastLink}>{applePodcastIcon}</a></li>}
        {podcastEpisode.podcast.spotifyPodcastLink && <li className={classes.podcastIcon}><a href={podcastEpisode.podcast.spotifyPodcastLink}>{spotifyPodcastIcon}</a></li>}
      </ul>
    </div>}
    {!post.shortform && !post.isEvent && <AnalyticsContext pageSectionContext="tagHeader">
      <FooterTagList post={post} hideScore />
    </AnalyticsContext>}
    {post.isEvent && <PostsPageEventData post={post}/>}
  </>
}

const PostsPagePostHeaderComponent = registerComponent(
  'PostsPagePostHeader', PostsPagePostHeader, {styles}
);

declare global {
  interface ComponentTypes {
    PostsPagePostHeader: typeof PostsPagePostHeaderComponent,
  }
}
