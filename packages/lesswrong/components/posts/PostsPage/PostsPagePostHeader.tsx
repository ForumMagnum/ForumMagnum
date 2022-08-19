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
import { googlePodcastIcon } from '../../icons/GooglePodcastIcon';
import { applePodcastIcon } from '../../icons/ApplePodcastIcon';
import { spotifyPodcastIcon } from '../../icons/SpotifyPodcastIcon';
import { useSingle } from '../../../lib/crud/withSingle';

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
    // display: 'inline-flex',
    marginRight: SECONDARY_SPACING,
    verticalAlign: 'middle',
    color: theme.palette.icon.dim600,
    height: '24px'
    // fontSize: theme.typography.body2.fontSize,
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
    marginBottom: '10px'
  },
  hideEmbeddedPlayer: {
    display: "none"
  },
  podcastIconList: {
    // display: 'inline-block'
    paddingLeft: '0px'
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

  // const { document: podcastEpisode } = useSingle({
  //   collectionName: "PodcastEpisodes",
  //   fragmentName: "PodcastEpisodesDefaultFragment",
  //   documentId: '62fead7ab3899c61b629aba7'
  // })

  console.log({ podcastEpisode });
  // console.log({ podcastEpisode });
  
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
    {/* <NoSSR>
      <div id="buzzsprout-player-11155706" />
      <script src="https://www.buzzsprout.com/2036194/11155706-go-forth-and-create-the-art.js?container_id=buzzsprout-player-11155706&amp;player=small" type="text/javascript" charSet="utf-8" defer>
        console.log('foobar');
        {`if (buzzsproutPlayerContainer) {
          console.log({ buzzsproutPlayerContainer });
          buzzsproutPlayerContainer.innerHTML = renderBuzzsproutPlayerHTML();
        } else {
          console.log('Container div not captured');
          document.write(renderBuzzsproutPlayerHTML());
        }`}
      </script>
    </NoSSR> */}
    {podcastEpisode && <div className={classNames({ [classes.hideEmbeddedPlayer]: !showEmbeddedPlayer })}>
      {isClient && <NoSSR>
        {/* <div
          className={classNames(classes.embeddedPlayer, { [classes.hideEmbeddedPlayer]: !showEmbeddedPlayer })}
          data-bt-embed="https://player.backtracks.fm/backtracks/backtracks/m/player-example"
          data-bt-theme="light"
          data-bt-primary-color="#5f9b65"
          data-bt-show-comments="false"
          data-bt-show-art-cover="false"
          data-bt-preview="false">
        </div>
        {embedScriptFunction('https://player.backtracks.fm/embedder.js', window, document)} */}
        <div
          id={`buzzsprout-player-${podcastEpisode.externalEpisodeId}`}
          className={classes.embeddedPlayer}
        />
        {embedScriptFunction(podcastEpisode.episodeLink, window, document)}
        {/* {embedScriptFunction('https://www.buzzsprout.com/2036194/11155706-go-forth-and-create-the-art.js?container_id=buzzsprout-player-11155706&amp;player=small', window, document)} */}
        {/* <iframe
          className={classNames(classes.embeddedPlayer, { [classes.hideEmbeddedPlayer]: !showEmbeddedPlayer })}
          title="Embed Player"
          src="//play.libsyn.com/embed/destination/id/3505820/height/192/theme/modern/size//thumbnail/no/custom-color/ffffff/hide-show/yes/hide-playlist/yes/hide-subscribe/yes/hide-share/yes"
          height="192"
          width="100%"
          scrolling="no"
          allowFullScreen={false}
          style={{border: 'none'}}
        />
        <iframe
          className={classNames(classes.embeddedPlayer, { [classes.hideEmbeddedPlayer]: !showEmbeddedPlayer })}
          src='https://share.transistor.fm/e/build-your-saas/latest'
          width='100%'
          height='180'
          frameBorder='0'
          scrolling='no'
          seamless
          style={{ width:'100%', height:'180px' }}
        /> */}
      </NoSSR>}
      <ul className={classes.podcastIconList}>
        {podcastEpisode.podcast.applePodcastLink && <li className={classes.podcastIcon}>{applePodcastIcon}</li>}
        {podcastEpisode.podcast.spotifyPodcastLink &&<li className={classes.podcastIcon}>{spotifyPodcastIcon}</li>}
        {/* <li className={classes.podcastIcon}>{googlePodcastIcon}</li> */}
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
