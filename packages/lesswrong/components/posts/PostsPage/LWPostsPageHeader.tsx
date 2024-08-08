import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { extractVersionsFromSemver } from '../../../lib/editor/utils';
import { getUrlClass } from '../../../lib/routeUtil';
import classNames from 'classnames';
import { isServer } from '../../../lib/executionEnvironment';
import { isFriendlyUI } from '../../../themes/forumTheme';
import type { AnnualReviewMarketInfo } from '../../../lib/annualReviewMarkets';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingTop: 120,
    marginBottom: 108,
    [theme.breakpoints.down('xs')]: {
      paddingTop: 16,
      marginBottom: 16
    },
  },
  eventHeader: {
    marginBottom: 0,
  },
  authorAndSecondaryInfo: {
    display: 'flex',
    alignItems: 'center',
    columnGap: 20,
    ...theme.typography.commentStyle,
    flexWrap: 'wrap',
    color: theme.palette.text.dim3,
    marginTop: 12
  },
  authorInfo: {
    maxWidth: "calc(100% - 150px)",
    [theme.breakpoints.down('sm')]: {
      maxWidth: "calc(100% - 60px)",
      fontSize: theme.typography.body2.fontSize,
    },
  },
  feedName: {
    fontSize: theme.typography.body2.fontSize,
    [theme.breakpoints.down('sm')]: {
      display: "none"
    }
  },
  topRight: {
    position: 'absolute',
    right: 8, 
    top: -48,
    display: 'flex',
    [theme.breakpoints.down('sm')]: {
      top: -16,
      marginTop: 8,
      marginBottom: 8
    },
    [theme.breakpoints.down('xs')]: {
      display: 'none'
    }
  },
  audioPlayerWrapper: {
    position: 'absolute',
    right: 8, 
    top: 15,
    display: 'flex',
    [theme.breakpoints.down('sm')]: {
      top: 8,
      right: 8
    }
  },
  sequenceNav: {
    marginBottom: 8,
    marginTop: -22
  },
  eventData: {
    marginTop: 48
  },
  titleSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  title: {
    [theme.breakpoints.down('sm')]: {
      marginBottom: 10
    }
  },
  mobileHeaderVote: {
    textAlign: 'center',
    fontSize: 42,
    [theme.breakpoints.up("sm")]: {
      display: 'none'
    }
  },
  date: {
    marginTop: 8,
    marginBottom: 8
  },
  mobileButtons: {
    display: 'flex',
    alignItems: 'center',
    [theme.breakpoints.up('sm')]: {
      display: 'none'
    }
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


/// LWPostsPageHeader: The metadata block at the top of a post page, with
/// title, author, voting, an actions menu, etc.
const LWPostsPageHeader = ({post, answers = [], dialogueResponses = [], showEmbeddedPlayer, toggleEmbeddedPlayer, hideMenu, hideTags, annualReviewMarketInfo, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  answers?: CommentsList[],
  dialogueResponses?: CommentsList[],
  showEmbeddedPlayer?: boolean,
  toggleEmbeddedPlayer?: () => void,
  hideMenu?: boolean,
  hideTags?: boolean,
  annualReviewMarketInfo?: AnnualReviewMarketInfo,
  classes: ClassesType,
}) => {
  const {PostsPageTitle, PostsAuthors, LWTooltip, PostsPageDate, CrosspostHeaderIcon, PostsGroupDetails, PostsTopSequencesNav, PostsPageEventData, AddToCalendarButton, GroupLinks, LWPostsPageHeaderTopRight, PostsAudioPlayerWrapper, PostsVote, AudioToggle, PostActionsButton } = Components;
  // eslint-disable-next-line react-hooks/exhaustive-deps

  const rssFeedSource = ('feed' in post) ? post.feed : null;
  const feedLinkDescription = rssFeedSource?.url && getHostname(rssFeedSource.url)
  const feedLink = rssFeedSource?.url && `${getProtocol(rssFeedSource.url)}//${getHostname(rssFeedSource.url)}`;
  const hasMajorRevision = ('version' in post) && extractVersionsFromSemver(post.version).major > 1

  const crosspostNode = post.fmCrosspost?.isCrosspost && !post.fmCrosspost.hostedHere &&
    <CrosspostHeaderIcon post={post} />
  
  // TODO: If we are not the primary author of this post, but it was shared with
  // us as a draft, display a notice and a link to the collaborative editor.

  return <div className={classNames(classes.root, {[classes.eventHeader]: post.isEvent})}>
      {post.group && <PostsGroupDetails post={post} documentId={post.group._id} />}
      <AnalyticsContext pageSectionContext="topSequenceNavigation">
        {('sequence' in post) && !!post.sequence && <div className={classes.sequenceNav}>
          <PostsTopSequencesNav post={post} />
        </div>}
      </AnalyticsContext>
      <div>
        {!post.shortform && <span className={classes.topRight}>
          <LWPostsPageHeaderTopRight post={post} toggleEmbeddedPlayer={toggleEmbeddedPlayer} showEmbeddedPlayer={showEmbeddedPlayer}/>
        </span>}
        {post && <span className={classes.audioPlayerWrapper}>
          <PostsAudioPlayerWrapper showEmbeddedPlayer={!!showEmbeddedPlayer} post={post}/>
        </span>}
      </div>
      <div className={classes.titleSection}>
        <div className={classes.title}>
          <PostsPageTitle post={post} />
          <div className={classes.authorAndSecondaryInfo}>
            <div className={classes.authorInfo}>
              <PostsAuthors post={post} pageSectionContext="post_header" />
            </div>
            {crosspostNode}
            <div className={classes.date}>
              <PostsPageDate post={post} hasMajorRevision={hasMajorRevision} />
            </div>
            {rssFeedSource && rssFeedSource.user &&
              <LWTooltip title={`Crossposted from ${feedLinkDescription}`} className={classes.feedName}>
                <a href={feedLink}>{rssFeedSource.nickname}</a>
              </LWTooltip>
            }
            {post.isEvent && <GroupLinks document={post} noMargin />}
            <AddToCalendarButton post={post} label="Add to calendar" hideTooltip />
            <div className={classes.mobileButtons}>
              <AudioToggle post={post} toggleEmbeddedPlayer={toggleEmbeddedPlayer} showEmbeddedPlayer={showEmbeddedPlayer} />
              <PostActionsButton post={post} className={classes.postActionsButton} flip />
            </div>
          </div>
        </div>
        <div className={classes.mobileHeaderVote}>
          <PostsVote post={post} />
        </div>
      </div>
      {post.isEvent && <div className={classes.eventData}>
        <PostsPageEventData post={post}/>
      </div>}
  </div>
}

const LWPostsPageHeaderComponent = registerComponent(
  'LWPostsPageHeader', LWPostsPageHeader, {styles}
);

declare global {
  interface ComponentTypes {
    LWPostsPageHeader: typeof LWPostsPageHeaderComponent,
  }
}

