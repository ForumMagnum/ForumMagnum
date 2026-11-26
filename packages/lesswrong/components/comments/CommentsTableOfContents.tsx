import { useForumType } from '@/components/hooks/useForumType';
import React, { useEffect, useRef, useState } from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { CommentTreeNode } from '../../lib/utils/unflatten';
import { useScrollHighlight } from '../hooks/useScrollHighlight';
import isEmpty from 'lodash/isEmpty';
import qs from 'qs'
import classNames from 'classnames';
import { commentIdToLandmark, getCurrentSectionMark, getLandmarkY } from '@/lib/scrollUtils';
import { useLocation, useNavigate } from "../../lib/routeUtil";
import TableOfContentsDivider from "../posts/TableOfContents/TableOfContentsDivider";
import UsersNameDisplay from "../users/UsersNameDisplay";
import TableOfContentsRow from "../posts/TableOfContents/TableOfContentsRow";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { getPingbackElementId } from '@/lib/pingback';
import { isPingbackListEntry, type CommentsListEntry, type PingbackListEntry } from './interleavePingbacks';
const COMMENTS_TITLE_CLASS_NAME = 'CommentsTableOfContentsTitle';

const styles = defineStyles("CommentsTableOfContents", (theme: ThemeType) => ({
  root: {
    color: theme.palette.text.dim,
    //Override bottom border of title row for FixedToC but not in other uses of TableOfContentsRow
    '& .TableOfContentsRow-title': {
      borderBottom: "none",
    },
  },
  comment: {
    display: "inline-flex",
  },
  pingback: {
    display: "flex",
    minWidth: 0,
  },
  pingbackTitle: {
    fontStyle: "italic",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  commentKarma: {
    width: 20,
    textAlign: "right",
    marginRight: 4,
  },
  postTitle: {
    minHeight: 76,
    paddingTop: 16,
    ...theme.typography.body2,
    ...theme.typography.postStyle,
    ...theme.typography.smallCaps,
    cursor: "pointer",
    fontSize: "1.3rem",
    paddingBottom: 16,
    display: 'flex',
    alignItems: 'center',
  },
  highlightUnread: {
    paddingLeft: 4,
    marginLeft: -7,
    borderLeft: `solid 3px ${theme.palette.secondary.main}`
  },
  '@global': {
    // Hard-coding this class name as a workaround for one of the JSS plugins being incapable of parsing a self-reference ($titleContainer) while inside @global
    [`body:has(.headroom--pinned) .${COMMENTS_TITLE_CLASS_NAME}, body:has(.headroom--unfixed) .${COMMENTS_TITLE_CLASS_NAME}`]: {
      opacity: 0,
    }
  }
}));

const CommentsTableOfContents = ({commentTree, answersTree, post, highlightDate}: {
  commentTree?: CommentsListEntry[],
  answersTree?: CommentTreeNode<CommentsList>[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  highlightDate: Date|undefined,
}) => {
  const classes = useStyles(styles);
  const elementIds = [
    ...getCommentTreeIds(answersTree ?? []),
    ...getEntryElementIds(commentTree ?? []),
  ];
  const { landmarkName: highlightedLandmarkName } = useScrollHighlight(
    elementIds.map(elementId => commentIdToLandmark(elementId))
  );

  if (elementIds.length === 0) {
    return null;
  }
  
  return <div className={classes.root}>
    <CommentsTableOfContentsTitle post={post}/>

    {answersTree && answersTree.map(answer => <>
      <ToCCommentBlock
        key={answer.item._id}
        commentTree={answer} indentLevel={1}
        highlightedCommentId={highlightedLandmarkName}
        highlightDate={highlightDate}
      />
      <TableOfContentsDivider/>
    </>)}
    {commentTree && commentTree.map(entry => isPingbackListEntry(entry)
      ? <ToCPingbackBlock
        key={entry.pingback._id}
        entry={entry}
        indentLevel={1}
        highlightDate={highlightDate}
        highlightedCommentId={highlightedLandmarkName}
      />
      : <ToCCommentBlock
        key={entry.item._id}
        commentTree={entry}
        indentLevel={1}
        highlightDate={highlightDate}
        highlightedCommentId={highlightedLandmarkName}
      />
    )}
  </div>
}

const CommentsTableOfContentsTitle = ({post}: {
  post: PostsWithNavigation | PostsWithNavigationAndRevision
}) => {
  const classes = useStyles(styles);
  const [pageHeaderCoversTitle, setPageHeaderCoversTitle] = useState(false);
  const titleRef = useRef<HTMLAnchorElement|null>(null);
  const hideTitleContainer = pageHeaderCoversTitle;

  useEffect(() => {
    const target = titleRef.current;
    if (target) {
      // To prevent the comment ToC title from being hidden when scrolling up
      // This relies on the complementary `top: -1px` styling in `MultiToCLayout` on the parent sticky element
      const observer = new IntersectionObserver(([e]) => {
        setPageHeaderCoversTitle(e.intersectionRatio < 1);
      }, { threshold: [1] });
  
      observer.observe(target);
      return () => observer.unobserve(target);
    }
  }, []);

  return <a id="comments-table-of-contents" href="#" className={classNames(
    classes.postTitle,
    {[COMMENTS_TITLE_CLASS_NAME]: hideTitleContainer}
  )}
    onClick={ev => {
      ev.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }}
    ref={titleRef}
  >
    {post.title?.trim()}
  </a>
}

const ToCCommentBlock = ({commentTree, indentLevel, highlightedCommentId, highlightDate}: {
  commentTree: CommentTreeNode<CommentsList>,
  indentLevel: number,
  highlightedCommentId: string|null,
  highlightDate: Date|undefined,
}) => {
  const { isAF } = useForumType();
  const classes = useStyles(styles);
  const comment = commentTree.item;
  const onClick = useScrollToElementOnClick(comment._id);
  
  const score = isAF
    ? comment.afBaseScore
    : comment.baseScore;
  
  return <>
    <TableOfContentsRow
      indentLevel={indentLevel}
      highlighted={highlightedCommentId===comment._id}
      dense
      href={"#"+comment._id}
      onClick={onClick}
    >
      <span className={classNames(classes.comment, {
        [classes.highlightUnread]: highlightDate && new Date(comment.postedAt) > new Date(highlightDate),
      })}>
        <span className={classes.commentKarma}>{score}</span>
        <CommentToCUsername comment={comment}/>
      </span>
    </TableOfContentsRow>
    
    {commentTree.children.map(child =>
      <ToCCommentBlock
        key={child.item._id}
        highlightedCommentId={highlightedCommentId}
        highlightDate={highlightDate}
        commentTree={child}
        indentLevel={indentLevel+1}
      />
    )}
  </>
}

const ToCPingbackBlock = ({entry, indentLevel, highlightedCommentId, highlightDate}: {
  entry: PingbackListEntry,
  indentLevel: number,
  highlightedCommentId: string|null,
  highlightDate: Date|undefined,
}) => {
  const { isAF } = useForumType();
  const classes = useStyles(styles);
  const { pingback, children } = entry;
  const elementId = getPingbackElementId(pingback._id);
  const onClick = useScrollToElementOnClick(elementId);

  return <>
    <TableOfContentsRow
      indentLevel={indentLevel}
      highlighted={highlightedCommentId===elementId}
      dense
      href={"#"+elementId}
      onClick={onClick}
    >
      <span className={classes.pingback}>
        <span className={classes.commentKarma}>{isAF ? pingback.afBaseScore : pingback.baseScore}</span>
        <span className={classes.pingbackTitle}>{pingback.sourcePost.title}</span>
      </span>
    </TableOfContentsRow>

    {children.map(child =>
      <ToCCommentBlock
        key={child.item._id}
        highlightedCommentId={highlightedCommentId}
        highlightDate={highlightDate}
        commentTree={child}
        indentLevel={indentLevel+1}
      />
    )}
  </>
}

/**
 * Click handler for a ToC row which scrolls to the element with the given ID
 * and puts that ID in the URL hash.
 */
function useScrollToElementOnClick(elementId: string) {
  const navigate = useNavigate();
  const { query, location } = useLocation();

  return (ev: React.MouseEvent) => {
    const elementTop = getLandmarkY(commentIdToLandmark(elementId));
    if (elementTop) {
      // Add window.scrollY because window.scrollTo takes a relative scroll distance
      // rather than an absolute scroll position, and a +1 because of rounding issues
      // that otherwise cause us to wind up just above the comment such that the ToC
      // highlights the wrong one.
      const y = elementTop + window.scrollY - getCurrentSectionMark() + 1;
      window.scrollTo({ top: y, behavior: "smooth" });
    }

    delete query.commentId;
    navigate({
      ...location,
      search: isEmpty(query) ? '' : `?${qs.stringify(query)}`,
      hash: `#${elementId}`,
    }, { skipRouter: true });
    ev.stopPropagation();
    ev.preventDefault();
  };
}

/**
 * Username for a comment, shown in the comments table of contents. For hidden/
 * deleted users, this reproduces the logic in CommentUserName (this isn't a
 * shared component with CommentUserName because the styling and the click and
 * tooltip behaviors are different).
 */
function CommentToCUsername({comment}: {
  comment: CommentsList
}) {
  if (comment.deleted) {
    return <span>[comment deleted]</span>
  } else if (comment.hideAuthor || !comment.user || comment.user.deleted) {
    return <span>[anonymous]</span>
  } else {
    return <UsersNameDisplay user={comment.user} simple/>
  }
}

function getCommentTreeIds(commentTrees: CommentTreeNode<CommentsList>[]): string[] {
  return commentTrees.flatMap(tree => [tree.item._id, ...getCommentTreeIds(tree.children)]);
}

function getEntryElementIds(entries: CommentsListEntry[]): string[] {
  return entries.flatMap(entry => isPingbackListEntry(entry)
    ? [getPingbackElementId(entry.pingback._id), ...getCommentTreeIds(entry.children)]
    : getCommentTreeIds([entry])
  );
}

export default registerComponent('CommentsTableOfContents', CommentsTableOfContents, {
  areEqual: "auto"
});
