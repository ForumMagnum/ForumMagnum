import React, { FC, MouseEvent, useEffect, useMemo } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { postGetAnswerCountStr, postGetCommentCount, postGetCommentCountStr } from '../../../lib/collections/posts/helpers';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { extractVersionsFromSemver } from '../../../lib/editor/utils'
import { getUrlClass } from '../../../lib/routeUtil';
import classNames from 'classnames';
import { isServer } from '../../../lib/executionEnvironment';
import moment from 'moment';
import { isEAForum, isLWorAF } from '../../../lib/instanceSettings';
import { useCookiesWithConsent } from '../../hooks/useCookiesWithConsent';
import { PODCAST_TOOLTIP_SEEN_COOKIE } from '../../../lib/cookies/cookies';

const SECONDARY_SPACING = 20;
const PODCAST_ICON_SIZE = isEAForum ? 22 : 24;
// some padding around the icon to make it look like a stateful toggle button
const PODCAST_ICON_PADDING = isEAForum ? 4 : 2

const styles = (theme: ThemeType): JssStyles => ({
  header: {
    position: 'relative',
    display:"flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: isEAForum ? 20 : theme.spacing.unit*2,
  },
  headerLeft: {
    width: "100%"
  },
  headerVote: {
    textAlign: 'center',
    fontSize: 42,
    position: isEAForum ? 'absolute' : "relative",
    top: isEAForum ? 0 : undefined,
    left: isEAForum ? -93 : undefined,
    [theme.breakpoints.down("sm")]: {
      position: 'relative',
      top: 'auto',
      left: 'auto'
    }
  },
  eventHeader: {
    marginBottom: 0,
  },
  authorAndSecondaryInfo: {
    display: 'flex',
    alignItems: 'baseline',
    columnGap: SECONDARY_SPACING,
    flexWrap: 'wrap',
    fontSize: isEAForum ? theme.typography.body1.fontSize : '1.4rem',
    fontWeight: isEAForum ? 450 : undefined,
    fontFamily: theme.typography.uiSecondary.fontFamily,
    color: theme.palette.text.dim3,
    paddingBottom: isEAForum ? 12 : undefined,
    borderBottom: isEAForum ? theme.palette.border.grey300 : undefined
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
    fontWeight: isEAForum ? 450 : undefined,
    fontSize: isEAForum ? undefined : theme.typography.body2.fontSize,
    "@media print": { display: "none" },
  },
  wordCount: {
    fontWeight: isEAForum ? 450 : undefined,
    fontSize: isEAForum ? undefined : theme.typography.body2.fontSize,
    cursor: 'default',
    "@media print": { display: "none" },
  },
  togglePodcastContainer: {
    alignSelf: 'center',
    color: isEAForum ? undefined : theme.palette.primary.main,
    height: isEAForum ? undefined : PODCAST_ICON_SIZE,
  },
  audioIcon: {
    width: PODCAST_ICON_SIZE + (PODCAST_ICON_PADDING * 2),
    height: PODCAST_ICON_SIZE + (PODCAST_ICON_PADDING * 2),
    transform: isEAForum ? `translateY(${5-PODCAST_ICON_PADDING}px)` : `translateY(-${PODCAST_ICON_PADDING}px)`,
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
    color: isEAForum ? undefined : theme.palette.grey[500],
    "&:hover": {
      opacity: 0.5,
    },
    '& svg': {
      color: 'inherit' // this is needed for the EAF version of the icon
    },
    "@media print": { display: "none" },
  },
  authorInfo: {
    display: 'flex',
    alignItems: 'baseline',
    columnGap: SECONDARY_SPACING,
  },
  authors: {
    fontSize: theme.typography.body1.fontSize,
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

const CommentsLink: FC<{
  anchor: string,
  children: React.ReactNode,
  className?: string,
}> = ({anchor, children, className}) => {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const elem = document.querySelector(anchor);
    if (elem) {
      // Match the scroll behaviour from TableOfContentsList
      window.scrollTo({
        top: elem.getBoundingClientRect().y - (window.innerHeight / 3) + 1,
        behavior: "smooth",
      });
    }
  }
  return (
    <a className={className} {...(isEAForum ? {onClick} : {href: anchor})}>
      {children}
    </a>
  );
}

/// PostsPagePostHeader: The metadata block at the top of a post page, with
/// title, author, voting, an actions menu, etc.
const PostsPagePostHeader = ({post, answers = [], dialogueResponses = [], showEmbeddedPlayer, toggleEmbeddedPlayer, hideMenu, hideTags, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  answers?: CommentsList[],
  dialogueResponses?: CommentsList[],
  showEmbeddedPlayer?: boolean,
  toggleEmbeddedPlayer?: () => void,
  hideMenu?: boolean,
  hideTags?: boolean,
  classes: ClassesType,
}) => {
  const {PostsPageTitle, PostsAuthors, LWTooltip, PostsPageDate, CrosspostHeaderIcon,
    PostActionsButton, PostsVote, PostsGroupDetails, PostsTopSequencesNav,
    PostsPageEventData, FooterTagList, AddToCalendarButton, BookmarkButton,
    NewFeaturePulse, ForumIcon, GroupLinks, SharePostButton} = Components;
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

  const feedLinkDescription = post.feed?.url && getHostname(post.feed.url)
  const feedLink = post.feed?.url && `${getProtocol(post.feed.url)}//${getHostname(post.feed.url)}`;
  const { major } = extractVersionsFromSemver(post.version)
  const hasMajorRevision = major > 1

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
  } = useMemo(() => getResponseCounts(post, answers), [post, answers]);

  const minimalSecondaryInfo = post.isEvent || (isEAForum && post.shortform);

  const readingTimeNode = minimalSecondaryInfo
    ? null
    : (
      <LWTooltip title={`${wordCount} words`}>
        <span className={classes.wordCount}>{readTime} min read</span>
      </LWTooltip>
    );

  const answersNode = !post.question || minimalSecondaryInfo
    ? null
    : (
      <CommentsLink anchor="#answers" className={classes.secondaryInfoLink}>
        {postGetAnswerCountStr(answerCount)}
      </CommentsLink>
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

  const tripleDotMenuNode = !hideMenu &&
    <span className={classes.actions}>
      <AnalyticsContext pageElementContext="tripleDotMenu">
        <PostActionsButton post={post} includeBookmark={!isEAForum} flip={true}/>
      </AnalyticsContext>
    </span>

  // this is the info section under the post title, to the right of the author names
  let secondaryInfoNode = <div className={classes.secondaryInfo}>
    <div className={classes.secondaryInfoLeft}>
      {crosspostNode}
      {readingTimeNode}
      {!minimalSecondaryInfo && <PostsPageDate post={post} hasMajorRevision={hasMajorRevision} />}
      {post.isEvent && <GroupLinks document={post} noMargin />}
      {answersNode}
      <CommentsLink anchor="#comments" className={classes.secondaryInfoLink}>
        {postGetCommentCountStr(post, commentCount)}
      </CommentsLink>
      {audioNode}
      {addToCalendarNode}
      {tripleDotMenuNode}
    </div>
  </div>
  // EA Forum splits the info into two sections, plus has the info in a different order
  if (isEAForum) {
    secondaryInfoNode = <div className={classes.secondaryInfo}>
      <div className={classes.secondaryInfoLeft}>
        {!minimalSecondaryInfo && <PostsPageDate post={post} hasMajorRevision={hasMajorRevision} />}
        {readingTimeNode}
        {audioNode}
        {post.isEvent && <GroupLinks document={post} noMargin />}
        {answersNode}
        {!post.shortform &&
          <LWTooltip title={postGetCommentCountStr(post, commentCount)}>
            <CommentsLink anchor="#comments" className={classes.secondaryInfoLink}>
              <ForumIcon icon="Comment" className={classes.commentIcon} /> {commentCount}
            </CommentsLink>
          </LWTooltip>
        }
        {addToCalendarNode}
        {crosspostNode}
      </div>
      <div className={classes.secondaryInfoRight}>
        <BookmarkButton post={post} className={classes.bookmarkButton} placement='bottom-start' />
        <SharePostButton post={post} />
        {tripleDotMenuNode}
      </div>
    </div>
  }

  // TODO: If we are not the primary author of this post, but it was shared with
  // us as a draft, display a notice and a link to the collaborative editor.

  return <>
    {post.group && <PostsGroupDetails post={post} documentId={post.group._id} />}
    <AnalyticsContext pageSectionContext="topSequenceNavigation">
      <PostsTopSequencesNav post={post} />
    </AnalyticsContext>
    <div className={classNames(classes.header, {[classes.eventHeader]: post.isEvent})}>
      <div className={classes.headerLeft}>
        <PostsPageTitle post={post} />
        <div className={classes.authorAndSecondaryInfo}>
          <div className={classes.authorInfo}>
            <div className={classes.authors}>
              <PostsAuthors post={post} pageSectionContext="post_header" />
            </div>
            {post.feed && post.feed.user &&
              <LWTooltip title={`Crossposted from ${feedLinkDescription}`} className={classes.feedName}>
                <a href={feedLink}>{post.feed.nickname}</a>
              </LWTooltip>
            }
          </div>
          {secondaryInfoNode}
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
