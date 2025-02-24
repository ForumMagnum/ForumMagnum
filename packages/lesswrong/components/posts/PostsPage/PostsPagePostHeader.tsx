import React, { FC, MouseEvent, useMemo } from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib/components';
import { getResponseCounts, postGetAnswerCountStr, postGetCommentCountStr } from '../../../lib/collections/posts/helpers';
import { AnalyticsContext } from "../../../lib/analyticsEvents";
import { extractVersionsFromSemver } from '../../../lib/editor/utils';
import classNames from 'classnames';
import { isServer } from '../../../lib/executionEnvironment';
import { isBookUI, isFriendlyUI } from '../../../themes/forumTheme';
import { captureException } from '@sentry/core';
import type { AnnualReviewMarketInfo } from '../../../lib/collections/posts/annualReviewMarkets';
import { getUrlClass } from '@/server/utils/getUrlClass';

const SECONDARY_SPACING = 20;

const styles = (theme: ThemeType) => ({
  header: {
    position: 'relative',
    display:"flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: isFriendlyUI ? 20 : theme.spacing.unit*2,
  },
  headerLeft: {
    width: "100%"
  },
  headerVote: {
    textAlign: 'center',
    fontSize: 42,
    position: isFriendlyUI ? 'absolute' : "relative",
    top: isFriendlyUI ? 0 : undefined,
    left: isFriendlyUI ? -93 : undefined,
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
    fontSize: isFriendlyUI ? theme.typography.body1.fontSize : '1.4rem',
    fontWeight: isFriendlyUI ? 450 : undefined,
    fontFamily: theme.typography.uiSecondary.fontFamily,
    color: theme.palette.text.dim3,
    paddingBottom: isFriendlyUI ? 12 : undefined,
    borderBottom: isFriendlyUI ? theme.palette.border.grey300 : undefined
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
  headerFooter: { 
    display: 'flex',
    justifyContent: 'space-between',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
    },
    marginTop: 8,
    marginBottom: 16,
  },
  tagSection: {
    flex: 1,
    display: "flex",
    flexDirection: isFriendlyUI ? "column" : "row",
    height: "100%",
  }
});

// On the server, use the 'url' library for parsing hostname out of feed URLs.
// On the client, we instead create an <a> tag, set its href, and extract
// properties from that. (There is a URL class which theoretically would work,
// but it doesn't have the hostname field on IE11 and it's missing entirely on
// Opera Mini.)
const URLClass = getUrlClass()

export function getProtocol(url: string): string {
  if (isServer)
    return new URLClass(url).protocol;

  // From https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
  var parser = document.createElement('a');
  parser.href = url;
  return parser.protocol;
}

export function getHostname(url: string): string {
  if (isServer)
    return new URLClass(url).hostname;

  // From https://stackoverflow.com/questions/736513/how-do-i-parse-a-url-into-hostname-and-path-in-javascript
  var parser = document.createElement('a');
  parser.href = url;
  return parser.hostname;
}

/**
 * Intended to be used when you have a url-like string that might be missing the protocol (http(s)://) prefix
 * Trying to parse those with `new URL()`/`new URLClass()` blows up, so this tries to correctly handle them
 * We default to logging an error to sentry and returning nothing if even that fails, but not confident we shouldn't just continue to throw in a visible way
 */
export function parseUnsafeUrl(url: string) {
  const urlWithProtocol = url.slice(0, 4) === 'http'
    ? url
    : `https://${url}`;

  try {
    const parsedUrl = new URLClass(urlWithProtocol);
    const protocol = getProtocol(urlWithProtocol);
    const hostname = getHostname(urlWithProtocol);
  
    return { protocol, hostname, parsedUrl };
  } catch (err) {
    captureException(`Tried to parse url ${url} as ${urlWithProtocol} and failed`);
  }

  return {};
}

export const CommentsLink: FC<{
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
    <a className={className} {...(isFriendlyUI ? {onClick} : {href: anchor})}>
      {children}
    </a>
  );
}

/// PostsPagePostHeader: The metadata block at the top of a post page, with
/// title, author, voting, an actions menu, etc.
const PostsPagePostHeader = ({post, answers = [], dialogueResponses = [], showEmbeddedPlayer, toggleEmbeddedPlayer, hideMenu, hideTags, annualReviewMarketInfo, classes}: {
  post: PostsWithNavigation|PostsWithNavigationAndRevision|PostsListWithVotes,
  answers?: CommentsList[],
  dialogueResponses?: CommentsList[],
  showEmbeddedPlayer?: boolean,
  toggleEmbeddedPlayer?: () => void,
  hideMenu?: boolean,
  hideTags?: boolean,
  annualReviewMarketInfo?: AnnualReviewMarketInfo,
  classes: ClassesType<typeof styles>,
}) => {
  const { PostsPageTitle, PostsAuthors, LWTooltip, PostsPageDate, CrosspostHeaderIcon,
    PostActionsButton, PostsVote, PostsGroupDetails, PostsTopSequencesNav,
    PostsPageEventData, FooterTagList, AddToCalendarButton, BookmarkButton, 
    ForumIcon, GroupLinks, SharePostButton, AudioToggle, ReadTime } = Components;

  const hasMajorRevision = ('version' in post) && extractVersionsFromSemver(post.version).major > 1
  const rssFeedSource = ('feed' in post) ? post.feed : null;
  let feedLinkDomain;
  let feedLink;
  if (rssFeedSource?.url) {
    let feedLinkProtocol;
    ({ hostname: feedLinkDomain, protocol: feedLinkProtocol } = parseUnsafeUrl(rssFeedSource.url));
    feedLink = `${feedLinkProtocol}//${feedLinkDomain}`;
  }
  const crosspostNode = post.fmCrosspost?.isCrosspost && !post.fmCrosspost.hostedHere &&
    <CrosspostHeaderIcon post={post} />

  const {
    answerCount,
    commentCount,
  } = useMemo(() => getResponseCounts({ post, answers }), [post, answers]);

  const minimalSecondaryInfo = post.isEvent || (isFriendlyUI && post.shortform);

  const answersNode = !post.question || minimalSecondaryInfo
    ? null
    : (
      <CommentsLink anchor="#answers" className={classes.secondaryInfoLink}>
        {postGetAnswerCountStr(answerCount)}
      </CommentsLink>
    );

  const addToCalendarNode = post.startTime && <div className={classes.secondaryInfoLink}>
    <AddToCalendarButton post={post} label="Add to calendar" hideTooltip />
  </div>

  const tripleDotMenuNode = !hideMenu &&
    <span className={classes.actions}>
      <AnalyticsContext pageElementContext="tripleDotMenu">
        <PostActionsButton post={post} includeBookmark={isBookUI} flip={true}/>
      </AnalyticsContext>
    </span>

  // EA Forum splits the info into two sections, plus has the info in a different order
  const secondaryInfoNode = <div className={classes.secondaryInfo}>
      <div className={classes.secondaryInfoLeft}>
        {!minimalSecondaryInfo &&
          <>
            <PostsPageDate post={post} hasMajorRevision={hasMajorRevision} />
            <ReadTime post={post} dialogueResponses={dialogueResponses} />
          </>
        }
        <AudioToggle post={post} toggleEmbeddedPlayer={toggleEmbeddedPlayer} showEmbeddedPlayer={showEmbeddedPlayer} />
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

  // TODO: If we are not the primary author of this post, but it was shared with
  // us as a draft, display a notice and a link to the collaborative editor.

  return <>
    {post.group && <PostsGroupDetails post={post} documentId={post.group._id} />}
    <AnalyticsContext pageSectionContext="topSequenceNavigation">
      {('sequence' in post) && <PostsTopSequencesNav post={post} />}
    </AnalyticsContext>
    <div className={classNames(classes.header, {[classes.eventHeader]: post.isEvent})}>
      <div className={classes.headerLeft}>
        <PostsPageTitle post={post} />
        <div className={classes.authorAndSecondaryInfo}>
          <div className={classes.authorInfo}>
            <div className={classes.authors}>
              <PostsAuthors post={post} pageSectionContext="post_header" />
            </div>
            {rssFeedSource && rssFeedSource.user &&
              <LWTooltip title={`Crossposted from ${feedLinkDomain}`} className={classes.feedName}>
                <a href={feedLink}>{rssFeedSource.nickname}</a>
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
    <div className={classes.headerFooter}>
      <div className={classes.tagSection}>
        {!post.shortform && !post.isEvent && !hideTags && 
        <AnalyticsContext pageSectionContext="tagHeader">
          <FooterTagList post={post} hideScore allowTruncate overrideMargins={true} annualReviewMarketInfo={annualReviewMarketInfo} />
        </AnalyticsContext>}
      </div>
    </div>
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
