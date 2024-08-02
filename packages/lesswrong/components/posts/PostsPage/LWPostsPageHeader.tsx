import React, { FC, MouseEvent, useEffect, useMemo } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { getResponseCounts, postGetAnswerCountStr, postGetCommentCountStr } from '../../../lib/collections/posts/helpers';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { extractVersionsFromSemver } from '../../../lib/editor/utils';
import { getUrlClass } from '../../../lib/routeUtil';
import classNames from 'classnames';
import { isServer } from '../../../lib/executionEnvironment';
import moment from 'moment';
import { isLWorAF } from '../../../lib/instanceSettings';
import { useCookiesWithConsent } from '../../hooks/useCookiesWithConsent';
import { PODCAST_TOOLTIP_SEEN_COOKIE } from '../../../lib/cookies/cookies';
import { isBookUI, isFriendlyUI } from '../../../themes/forumTheme';
import type { AnnualReviewMarketInfo } from '../../../lib/annualReviewMarkets';
import { getVotingSystemByName } from '../../../lib/voting/votingSystems';

const SECONDARY_SPACING = 20;


const styles = (theme: ThemeType): JssStyles => ({
  root: {
    paddingTop: 100,
    marginBottom: 96
  },
  eventHeader: {
    marginBottom: 0,
  },
  authorAndSecondaryInfo: {
    display: 'flex',
    alignItems: 'baseline',
    columnGap: SECONDARY_SPACING,
    ...theme.typography.commentStyle,
    flexWrap: 'wrap',
    fontWeight: isFriendlyUI ? 450 : undefined,
    color: theme.palette.text.dim3,
    paddingBottom: isFriendlyUI ? 12 : undefined,
    borderBottom: isFriendlyUI ? theme.palette.border.grey300 : undefined
  },
  authorInfo: {
    maxWidth: "calc(100% - 150px)"
  },
  secondaryInfoLink: {
    fontWeight: isFriendlyUI ? 450 : undefined,
    fontSize: isFriendlyUI ? undefined : theme.typography.body2.fontSize,
    "@media print": { display: "none" },
  },
  actions: {
    color: isFriendlyUI ? undefined : theme.palette.grey[500],
    "&:hover": {
      opacity: 0.5,
    },
    '& svg': {
      color: 'inherit' // this is needed for the EAF version of the icon
    },
    "@media print": { display: "none" },
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
      top: 8,
      right: 8
    }
  },
  commentsCount: {
    ...theme.typography.commentStyle,
    color: theme.palette.grey[600],
    display: 'flex', 
    alignItems: 'center',
    margin: '0px 8px 0px 3px'
  },
  rightButtons: {
    position: "absolute",
    display: "flex",
    flexDirection: "column",
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)'
  },
  sequenceNav: {
    marginBottom: 8,
    marginTop: -22
  },
  eventData: {
    marginTop: 48
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
  const {PostsPageTitle, PostsAuthors, LWTooltip, PostsPageDate, CrosspostHeaderIcon, PostsGroupDetails, PostsTopSequencesNav, PostsPageEventData, AddToCalendarButton, GroupLinks, LWPostsPageHeaderTopRight, PostsAudioPlayerWrapper } = Components;
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
    {!post.shortform && <span className={classes.topRight}>
      <LWPostsPageHeaderTopRight post={post} toggleEmbeddedPlayer={toggleEmbeddedPlayer} showEmbeddedPlayer={showEmbeddedPlayer} />
    </span>}
    {post && <span><PostsAudioPlayerWrapper showEmbeddedPlayer={!!showEmbeddedPlayer} post={post}/></span>}
    <PostsPageTitle post={post} />
    <div className={classes.authorAndSecondaryInfo}>
      <div className={classes.authorInfo}>
        <PostsAuthors post={post} pageSectionContext="post_header" />
      </div>
      {crosspostNode}
      <PostsPageDate post={post} hasMajorRevision={hasMajorRevision} />
      {rssFeedSource && rssFeedSource.user &&
        <LWTooltip title={`Crossposted from ${feedLinkDescription}`} className={classes.feedName}>
          <a href={feedLink}>{rssFeedSource.nickname}</a>
        </LWTooltip>
      }
      {post.isEvent && <GroupLinks document={post} noMargin />}
      <AddToCalendarButton post={post} label="Add to calendar" hideTooltip />
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
