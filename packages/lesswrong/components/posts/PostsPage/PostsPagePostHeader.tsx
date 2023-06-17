import React, { FC, MouseEvent, useEffect, useMemo } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { postGetAnswerCountStr, postGetCommentCount, postGetCommentCountStr } from '../../../lib/collections/posts/helpers';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { extractVersionsFromSemver } from '../../../lib/editor/utils'
import { getUrlClass } from '../../../lib/routeUtil';
import classNames from 'classnames';
import { isServer } from '../../../lib/executionEnvironment';
import moment from 'moment';
import { isEAForum } from '../../../lib/instanceSettings';
import { useCookiesWithConsent } from '../../hooks/useCookiesWithConsent';
import { PODCAST_TOOLTIP_SEEN_COOKIE } from '../../../lib/cookies/cookies';

const SECONDARY_SPACING = 20;
const PODCAST_ICON_SIZE = isEAForum ? 22 : 24;

const styles = (theme: ThemeType): JssStyles => ({
  header: {
    position: 'relative',
    display:"flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: isEAForum ? 25 : theme.spacing.unit*2,
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
    fontSize: isEAForum ? theme.typography.body1.fontSize : '1.4rem',
    fontWeight: isEAForum ? 450 : undefined,
    fontFamily: theme.typography.uiSecondary.fontFamily,
    color: theme.palette.text.dim3,
  },
  groupLinks: {
    display: 'inline-block',
    marginRight: SECONDARY_SPACING,
  },
  secondaryInfoLink: {
    display: "inline-block",
    fontWeight: isEAForum ? 450 : undefined,
    fontSize: isEAForum ? undefined : theme.typography.body2.fontSize,
    marginRight: SECONDARY_SPACING,
    "@media print": { display: "none" },
  },
  wordCount: {
    display: 'inline-block',
    marginRight: SECONDARY_SPACING,
    fontWeight: isEAForum ? 450 : undefined,
    fontSize: isEAForum ? undefined : theme.typography.body2.fontSize,
    cursor: 'default',
    "@media print": { display: "none" },
  },
  togglePodcastContainer: {
    marginRight: SECONDARY_SPACING,
    verticalAlign: 'middle',
    color: isEAForum ? undefined : theme.palette.primary.main,
    height: PODCAST_ICON_SIZE,
  },
  togglePodcastIcon: {
    width: PODCAST_ICON_SIZE,
    height: PODCAST_ICON_SIZE,
    transform: isEAForum ? "translateY(-2px)" : undefined
  },
  actions: {
    display: 'inline-block',
    color: theme.palette.grey[500],
    "@media print": { display: "none" },
  },
  authors: {
    fontSize: theme.typography.body1.fontSize,
    display: 'inline-block',
    marginRight: SECONDARY_SPACING
  },
  feedName: {
    marginRight: SECONDARY_SPACING,
    display: 'inline-block',
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
  commentIcon: {
    fontSize: "1.4em",
    marginRight: 1,
    transform: "translateY(5px)",
  },
  bookmarkButton: {
    marginBottom: -5,
    marginRight: 16,
    height: 22,
    color: theme.palette.grey[600],
    "&:hover": {
      opacity: 0.5,
    },
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
const PostsPagePostHeader = ({post, answers = [], dialogueResponses = [], toggleEmbeddedPlayer, hideMenu, hideTags, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision,
  answers?: CommentsList[],
  dialogueResponses?: CommentsList[],
  toggleEmbeddedPlayer?: () => void,
  hideMenu?: boolean,
  hideTags?: boolean,
  classes: ClassesType,
}) => {
  const {PostsPageTitle, PostsAuthors, LWTooltip, PostsPageDate, CrosspostHeaderIcon,
    PostActionsButton, PostsVote, PostsGroupDetails, PostsTopSequencesNav,
    PostsPageEventData, FooterTagList, AddToCalendarButton, BookmarkButton,
    NewFeaturePulse, ForumIcon, SharePostButton} = Components;
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
  
  const readingTimeNode = !post.isEvent && <LWTooltip title={`${wordCount} words`}>
    <span className={classes.wordCount}>{readTime} min read</span>
  </LWTooltip>

  const commentCountNode = <CommentsLink anchor="#comments" className={classes.secondaryInfoLink}>
    {isEAForum ?
      <>
        <ForumIcon icon="Comment" className={classes.commentIcon} /> {commentCount}
      </> : postGetCommentCountStr(post, commentCount)
    }
  </CommentsLink>
  
  const audioNode = toggleEmbeddedPlayer &&
    (cachedTooltipSeen ?
      <LWTooltip title={'Listen to this post'} className={classes.togglePodcastContainer}>
        <a href="#" onClick={toggleEmbeddedPlayer}>
          <ForumIcon icon="VolumeUp" className={classes.togglePodcastIcon} />
        </a>
      </LWTooltip> :
      <NewFeaturePulse dx={-10} dy={4}>
        <LWTooltip title={'Listen to this post'} className={classes.togglePodcastContainer}>
        <a href="#" onClick={toggleEmbeddedPlayer}>
          <ForumIcon icon="VolumeUp" className={classes.togglePodcastIcon} />
        </a>
        </LWTooltip>
      </NewFeaturePulse>
    )

  // TODO: If we are not the primary author of this post, but it was shared with
  // us as a draft, display a notice and a link to the collaborative editor.
  
  return <>
    {post.group && <PostsGroupDetails post={post} documentId={post.group._id} />}
    <AnalyticsContext pageSectionContext="topSequenceNavigation">
      <PostsTopSequencesNav post={post} />
    </AnalyticsContext>
    <div className={classNames(classes.header, {[classes.eventHeader]:post.isEvent})}>
      <div className={classes.headerLeft}>
        <PostsPageTitle post={post} />
        <div className={classes.secondaryInfo}>
          <span className={classes.authors}>
            <PostsAuthors post={post} pageSectionContext="post_header" />
          </span>
          { post.feed && post.feed.user &&
            <LWTooltip title={`Crossposted from ${feedLinkDescription}`}>
              <a href={feedLink} className={classes.feedName}>
                {post.feed.nickname}
              </a>
            </LWTooltip>
          }
          {post.fmCrosspost?.isCrosspost && !post.fmCrosspost.hostedHere && <CrosspostHeaderIcon post={post} />}
          {!isEAForum && readingTimeNode}
          {!post.isEvent && <span className={classes.date}>
            <PostsPageDate post={post} hasMajorRevision={hasMajorRevision} />
          </span>}
          {isEAForum && readingTimeNode}
          {post.isEvent && <div className={classes.groupLinks}>
            <Components.GroupLinks document={post} noMargin={true} />
          </div>}
          {isEAForum && audioNode}
          {post.question &&
            <CommentsLink anchor="#answers" className={classes.secondaryInfoLink}>
              {postGetAnswerCountStr(answerCount)}
            </CommentsLink>
          }
          {isEAForum ? <LWTooltip title={postGetCommentCountStr(post, commentCount)}>
            {commentCountNode}
          </LWTooltip> : commentCountNode}
          {isEAForum && <BookmarkButton post={post} className={classes.bookmarkButton} placement='bottom-start' />}
          {isEAForum && <SharePostButton post={post} />}
          {!isEAForum && audioNode}
          {post.startTime && <div className={classes.secondaryInfoLink}>
            <AddToCalendarButton post={post} label="Add to calendar" hideTooltip={true} />
          </div>}
          {!hideMenu &&
            <span className={classes.actions}>
              <AnalyticsContext pageElementContext="tripleDotMenu">
                <PostActionsButton post={post} includeBookmark={!isEAForum} />
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
