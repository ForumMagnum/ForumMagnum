import React, { useEffect, useMemo } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { postGetAnswerCountStr, postGetCommentCount, postGetCommentCountStr } from '../../../lib/collections/posts/helpers';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { extractVersionsFromSemver } from '../../../lib/editor/utils'
import { getUrlClass } from '../../../lib/routeUtil';
import classNames from 'classnames';
import { isServer } from '../../../lib/executionEnvironment';
import VolumeUpIcon from '@material-ui/icons/VolumeUp';
import { useCookies } from 'react-cookie';
import moment from 'moment';
import { forumTypeSetting } from '../../../lib/instanceSettings';

const SECONDARY_SPACING = 20
const PODCAST_TOOLTIP_SEEN_COOKIE = 'podcast_tooltip_seen'

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
  togglePodcastIcon: {
    marginRight: SECONDARY_SPACING,
    verticalAlign: 'middle',
    color: theme.palette.primary.main,
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
});

const isAF = forumTypeSetting.get() === "AlignmentForum"

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

const countAnswersAndDescendents = (answers: CommentsList[]) => {
  const sum = answers.reduce((prev: number, curr: CommentsList) => prev + curr.descendentCount, 0);
  return sum + answers.length;
}

const getResponseCounts = (
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  answers: CommentsList[],
) => {
  // answers may include some which are deleted:true, deletedPublic:true (in which
  // case various fields are unpopulated and a deleted-item placeholder is shown
  // in the UI). These deleted answers are *not* included in post.commentCount.
  const nonDeletedAnswers = answers.filter(answer=>!answer.deleted);
  
  return {
    answerCount: nonDeletedAnswers.length,
    commentCount: postGetCommentCount(post) - countAnswersAndDescendents(nonDeletedAnswers),
  };
};

/// PostsPagePostHeader: The metadata block at the top of a post page, with
/// title, author, voting, an actions menu, etc.
const PostsPagePostHeader = ({post, answers = [], toggleEmbeddedPlayer, hideMenu, hideTags, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  answers?: CommentsList[],
  toggleEmbeddedPlayer?: () => void,
  hideMenu?: boolean,
  hideTags?: boolean,
  classes: ClassesType,
}) => {
  const {PostsPageTitle, PostsAuthors, LWTooltip, PostsPageDate, CrosspostHeaderIcon,
    PostActionsButton, PostsVote, PostsGroupDetails, PostsTopSequencesNav,
    PostsPageEventData, FooterTagList, AddToCalendarButton, PostsPageTopTag, NewFeaturePulse} = Components;
  const [cookies, setCookie] = useCookies([PODCAST_TOOLTIP_SEEN_COOKIE]);
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  const cachedTooltipSeen = useMemo(() => cookies[PODCAST_TOOLTIP_SEEN_COOKIE], []);

  useEffect(() => {
    if(!cachedTooltipSeen) {
      setCookie(PODCAST_TOOLTIP_SEEN_COOKIE, true, {
        expires: moment().add(10, 'years').toDate(),
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [])
  
  const feedLinkDescription = post.feed?.url && getHostname(post.feed.url)
  const feedLink = post.feed?.url && `${getProtocol(post.feed.url)}//${getHostname(post.feed.url)}`;
  const { major } = extractVersionsFromSemver(post.version)
  const hasMajorRevision = major > 1
  const wordCount = post.contents?.wordCount || 0
  const readTime = post.readTimeMinutes ?? 1

  const {
    answerCount,
    commentCount,
  } = useMemo(() => getResponseCounts(post, answers), [post, answers]);

  // TODO: If we are not the primary author of this post, but it was shared with
  // us as a draft, display a notice and a link to the collaborative editor.
  
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
          {post.fmCrosspost?.isCrosspost && !post.fmCrosspost.hostedHere && !isAF && <CrosspostHeaderIcon post={post} />}
          {!post.isEvent && <LWTooltip title={`${wordCount} words`}>
            <span className={classes.wordCount}>{readTime} min read</span>
          </LWTooltip>}
          {!post.isEvent && <span className={classes.date}>
            <PostsPageDate post={post} hasMajorRevision={hasMajorRevision} />
          </span>}
          {post.isEvent && <div className={classes.groupLinks}>
            <Components.GroupLinks document={post} noMargin={true} />
          </div>}
          {post.question && <a className={classes.commentsLink} href={"#answers"}>{postGetAnswerCountStr(answerCount)}</a>}
          <a className={classes.commentsLink} href={"#comments"}>{postGetCommentCountStr(post, commentCount)}</a>
          {toggleEmbeddedPlayer &&
            (cachedTooltipSeen ?
              <LWTooltip title={'Listen to this post'} className={classes.togglePodcastIcon}>
                <a href="#" onClick={toggleEmbeddedPlayer}>
                  <VolumeUpIcon />
                </a>
              </LWTooltip> :
              <NewFeaturePulse dx={-10} dy={4}>
                <LWTooltip title={'Listen to this post'} className={classes.togglePodcastIcon}>
                <a href="#" onClick={toggleEmbeddedPlayer}>
                  <VolumeUpIcon />
                </a>
                </LWTooltip>
              </NewFeaturePulse>
            )
          }
          <div className={classes.commentsLink}>
            <AddToCalendarButton post={post} label="Add to Calendar" hideTooltip={true} />
          </div>
          {!hideMenu &&
            <span className={classes.actions}>
              <AnalyticsContext pageElementContext="tripleDotMenu">
                <PostActionsButton post={post} />
              </AnalyticsContext>
            </span>
          }
        </div>
      </div>
      {!post.shortform && <div className={classes.headerVote}>
        <PostsVote post={post} />
      </div>}
    </div>
    {!post.shortform && !post.isEvent && !hideTags && <AnalyticsContext pageSectionContext="tagHeader">
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
