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
const PODCAST_ICON_SIZE = isFriendlyUI ? 22 : 24;
// some padding around the icon to make it look like a stateful toggle button
const PODCAST_ICON_PADDING = isFriendlyUI ? 4 : 2

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
  secondaryInfo: {
    flexGrow: 1,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    columnGap: SECONDARY_SPACING,
    rowGap: '10px',
    flexWrap: 'wrap',
    [theme.breakpoints.down("sm")]: {
      justifyContent: 'flex-start'
    }
  },
  secondaryInfoLeft: {
    display: 'flex',
    alignItems: 'baseline',
    columnGap: SECONDARY_SPACING,
    flexWrap: 'wrap'
  },
  secondaryInfoRight: {
    flex: 'none',
    display: 'flex',
    columnGap: SECONDARY_SPACING
  },
  secondaryInfoLink: {
    fontWeight: isFriendlyUI ? 450 : undefined,
    fontSize: isFriendlyUI ? undefined : theme.typography.body2.fontSize,
    "@media print": { display: "none" },
  },
  wordCount: {
    fontWeight: isFriendlyUI ? 450 : undefined,
    fontSize: isFriendlyUI ? undefined : theme.typography.body2.fontSize,
    cursor: 'default',
    "@media print": { display: "none" },
  },
  togglePodcastContainer: {
    alignSelf: 'center',
    color: isFriendlyUI ? undefined : theme.palette.primary.main,
    height: isFriendlyUI ? undefined : PODCAST_ICON_SIZE,
  },
  audioIcon: {
    marginLeft: 8,
    width: PODCAST_ICON_SIZE + (PODCAST_ICON_PADDING * 2),
    height: PODCAST_ICON_SIZE + (PODCAST_ICON_PADDING * 2),
    transform: isFriendlyUI ? `translateY(${5-PODCAST_ICON_PADDING}px)` : `translateY(-${PODCAST_ICON_PADDING}px)`,
    padding: PODCAST_ICON_PADDING
  },
  audioNewFeaturePulse: {
    top: PODCAST_ICON_PADDING * 1.5,
  },
  audioIconOn: {
    background: theme.palette.grey[200],
    borderRadius: theme.borderRadius.small
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
  divider: {
    marginTop: theme.spacing.unit*2,
    marginLeft:0,
    borderTop: theme.palette.border.faint,
    borderLeft: 'transparent'
  },
  commentIcon: {
    fontSize: "1.4em",
    marginRight: 1,
    transform: "translateY(5px)",
  },
  bookmarkButton: {
    marginBottom: -5,
    height: 22,
    color: theme.palette.grey[600],
    "&:hover": {
      opacity: 0.5,
    },
  },
  nonhumanAudio: {
    color: theme.palette.grey[500],
  },
  tagSection: {
    position: 'absolute',
    right: 8, 
    top: -48,
    display: 'flex',
    [theme.breakpoints.down('sm')]: {
      top: 8,
      right: 8
    }
  },
  rightHeaderVote: {
    display: 'flex',
    flexDirection: 'row-reverse',
    paddingLeft: 8,
    paddingRight: 8
  },
  postActionsButton: {
    display: 'flex',
    alignItems: 'center',
    opacity: 0.3
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
  const {PostsPageTitle, PostsAuthors, LWTooltip, PostsPageDate, CrosspostHeaderIcon,
    PostActionsButton, PostsGroupDetails, PostsTopSequencesNav,
    PostsPageEventData, FooterTagList, AddToCalendarButton,
    NewFeaturePulse, ForumIcon, GroupLinks, PostsSplashPageHeaderVote, RSVPs} = Components;
  const [cookies, setCookie] = useCookiesWithConsent([PODCAST_TOOLTIP_SEEN_COOKIE]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cachedTooltipSeen = useMemo(() => cookies[PODCAST_TOOLTIP_SEEN_COOKIE], []);

  useEffect(() => {
    if(!cachedTooltipSeen) {
      setCookie(PODCAST_TOOLTIP_SEEN_COOKIE, true, {
        expires: moment().add(2, 'years').toDate(),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const rssFeedSource = ('feed' in post) ? post.feed : null;
  const feedLinkDescription = rssFeedSource?.url && getHostname(rssFeedSource.url)
  const feedLink = rssFeedSource?.url && `${getProtocol(rssFeedSource.url)}//${getHostname(rssFeedSource.url)}`;
  const hasMajorRevision = ('version' in post) && extractVersionsFromSemver(post.version).major > 1

  const crosspostNode = post.fmCrosspost?.isCrosspost && !post.fmCrosspost.hostedHere &&
    <CrosspostHeaderIcon post={post} />

  const wordCount = useMemo(() => {
    if (!post.debate || dialogueResponses.length === 0) {
      return post.contents?.wordCount || 0;
    }

    return dialogueResponses.reduce((wordCount, response) => {
      wordCount += response.contents?.wordCount ?? 0;
      return wordCount;
    }, 0);
  }, [post, dialogueResponses]);

  /**
   * It doesn't make a ton of sense to fetch all the debate response comments in the resolver field, since we:
   * 1. already have them here
   * 2. need them to compute the word count in the debate case as well
   */
  const readTime = useMemo(() => {
    if (!post.debate || dialogueResponses.length === 0) {
      return post.readTimeMinutes ?? 1;
    }

    return Math.max(1, Math.round(wordCount / 250));
  }, [post, dialogueResponses, wordCount]);

  const {
    answerCount,
    commentCount,
  } = useMemo(() => getResponseCounts({ post, answers }), [post, answers]);

  const minimalSecondaryInfo = post.isEvent || (isFriendlyUI && post.shortform);

  const readingTimeNode = minimalSecondaryInfo
    ? null
    : (
      <LWTooltip title={`${wordCount} words`}>
        <span className={classes.wordCount}>{readTime} min read</span>
      </LWTooltip>
    );

  const nonhumanAudio = post.podcastEpisodeId === null && isLWorAF

  const audioIcon = <LWTooltip title={'Listen to this post'} className={classNames(classes.togglePodcastContainer, {[classes.nonhumanAudio]: nonhumanAudio})}>
    <a href="#" onClick={toggleEmbeddedPlayer}>
      <ForumIcon icon="VolumeUp" className={classNames(classes.audioIcon, {[classes.audioIconOn]: showEmbeddedPlayer})} />
    </a>
  </LWTooltip>

  const audioNode = toggleEmbeddedPlayer && (
    (cachedTooltipSeen || isLWorAF)
      ? audioIcon
      : (
        <NewFeaturePulse className={classes.audioNewFeaturePulse}>
          {audioIcon}
        </NewFeaturePulse>
      )
  )

  const addToCalendarNode = post.startTime && <div className={classes.secondaryInfoLink}>
    <AddToCalendarButton post={post} label="Add to calendar" hideTooltip />
  </div>
  
  // TODO: If we are not the primary author of this post, but it was shared with
  // us as a draft, display a notice and a link to the collaborative editor.

  const postActionsButton = <PostActionsButton post={post} className={classes.postActionsButton} flip />;
  const votingSystem = getVotingSystemByName(post.votingSystem ?? 'default');
  
  return <div className={classNames(classes.root, {[classes.eventHeader]: post.isEvent})}>
    {post.group && <PostsGroupDetails post={post} documentId={post.group._id} />}
    <AnalyticsContext pageSectionContext="topSequenceNavigation">
      {('sequence' in post) && !!post.sequence && <div className={classes.sequenceNav}>
        <PostsTopSequencesNav post={post} />
      </div>}
    </AnalyticsContext>
    {!post.shortform && <div className={classes.tagSection}>
      {!hideTags && <AnalyticsContext pageSectionContext="tagHeader">
        <FooterTagList post={post} hideScore useAltAddTagButton hideAddTag={true} align="right" noBackground />
      </AnalyticsContext>}
      {audioNode}
      <div className={classes.rightHeaderVote}>
        <PostsSplashPageHeaderVote post={post} votingSystem={votingSystem} /> 
      </div>
      {postActionsButton}
    </div>}
    <PostsPageTitle post={post} />
    <div className={classes.authorAndSecondaryInfo}>
      <div className={classes.authorInfo}>
        <PostsAuthors post={post} pageSectionContext="post_header" />
      </div>
      <PostsPageDate post={post} hasMajorRevision={hasMajorRevision} />
      {rssFeedSource && rssFeedSource.user &&
        <LWTooltip title={`Crossposted from ${feedLinkDescription}`} className={classes.feedName}>
          <a href={feedLink}>{rssFeedSource.nickname}</a>
        </LWTooltip>
      }
      {post.isEvent && <GroupLinks document={post} noMargin />}
      {addToCalendarNode}
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
