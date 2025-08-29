import React, { useEffect, useRef, useState } from 'react';
import { registerComponent } from "../../lib/vulcan-lib/components";
import { CommentTreeNode } from '../../lib/utils/unflatten';
import { useScrollHighlight } from '../hooks/useScrollHighlight';
import isEmpty from 'lodash/isEmpty';
import qs from 'qs'
import { commentsTableOfContentsEnabled } from '../../lib/betas';
import classNames from 'classnames';
import { isAF } from '@/lib/instanceSettings';
import { commentIdToLandmark, getCurrentSectionMark, getLandmarkY } from '@/lib/scrollUtils';
import { useLocation, useNavigate } from "../../lib/routeUtil";
import TableOfContentsDivider from "../posts/TableOfContents/TableOfContentsDivider";
import UsersNameDisplay from "../users/UsersNameDisplay";
import TableOfContentsRow from "../posts/TableOfContents/TableOfContentsRow";
import { defineStyles, useStyles } from '../hooks/useStyles';
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
  commentKarma: {
    width: 20,
    textAlign: "right",
    marginRight: 4,
  },
  collapseButtonWrapper: {
    marginLeft: 4,
    height: 24,
  },
  collapseButton: {
    "&:hover": {
      background: theme.palette.greyAlpha(0.1),
      borderRadius: 8,
    },
  },
  collapseButtonExpanded: {
  },
  collapseButtonCollapsed: {
    transform: "rotate(-90deg)",
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
  tocPostedAt: {
    color: theme.palette.link.tocLink
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
  commentTree?: CommentTreeNode<CommentsList>[],
  answersTree?: CommentTreeNode<CommentsList>[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  highlightDate: Date|undefined,
}) => {
  const classes = useStyles(styles);
  const flattenedComments = flattenCommentTree([
    ...(answersTree ?? []),
    ...(commentTree ?? [])
  ]);
  const { landmarkName: highlightedLandmarkName } = useScrollHighlight(
    flattenedComments.map(comment => commentIdToLandmark(comment._id))
  );

  if (flattenedComments.length === 0) {
    return null;
  }
  
  if (!commentsTableOfContentsEnabled()) {
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
    {commentTree && commentTree.map(comment => <ToCCommentBlock
      key={comment.item._id}
      commentTree={comment}
      indentLevel={1}
      highlightDate={highlightDate}
      highlightedCommentId={highlightedLandmarkName}
    />)}
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
  const classes = useStyles(styles);
  const navigate = useNavigate();
  const { query, location } = useLocation();
  const comment = commentTree.item;
  
  const score = isAF()
    ? comment.afBaseScore
    : comment.baseScore;
  
  return <>
    <TableOfContentsRow
      indentLevel={indentLevel}
      highlighted={highlightedCommentId===comment._id}
      dense
      href={"#"+comment._id}
      onClick={ev => {
        const commentTop = getLandmarkY(commentIdToLandmark(comment._id));
        if (commentTop) {
          // Add window.scrollY because window.scrollTo takes a relative scroll distance
          // rather than an absolute scroll position, and a +1 because of rounding issues
          // that otherwise cause us to wind up just above the comment such that the ToC
          // highlights the wrong one.
          const y = commentTop + window.scrollY - getCurrentSectionMark() + 1;
          window.scrollTo({ top: y, behavior: "smooth" });
        }

        delete query.commentId;
        navigate({
          ...location,
          search: isEmpty(query) ? '' : `?${qs.stringify(query)}`,
          hash: `#${comment._id}`,
        }, { skipRouter: true });
        ev.stopPropagation();
        ev.preventDefault();
      }}
    >
      <span className={classNames(classes.comment, {
        [classes.highlightUnread]: highlightDate && new Date(comment.postedAt) > new Date(highlightDate),
      })}>
        <span className={classes.commentKarma}>{score}</span>
        {comment.deleted
          ? <span>[comment deleted]</span>
          : <UsersNameDisplay user={comment.user} simple/>
        }
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

function flattenCommentTree(commentTree: CommentTreeNode<CommentsList>[]): CommentsList[] {
  let result: CommentsList[] = [];
  
  function visitComment(c: CommentTreeNode<CommentsList>) {
    if (c.item) {
      result.push(c.item);
    }
    for (const child of c.children) {
      visitComment(child);
    }
  }
  
  for (let comment of commentTree)
    visitComment(comment);
  
  return result;
}

export default registerComponent('CommentsTableOfContents', CommentsTableOfContents, {
  areEqual: "auto"
});
