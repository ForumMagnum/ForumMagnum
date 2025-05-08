import React, { useEffect, useRef, useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { CommentTreeNode } from '../../lib/utils/unflatten';
import { useScrollHighlight } from '../hooks/useScrollHighlight';
import isEmpty from 'lodash/isEmpty';
import qs from 'qs'
import { commentsTableOfContentsEnabled } from '../../lib/betas';
import classNames from 'classnames';
import { forumTypeSetting } from '@/lib/instanceSettings';
import { commentIdToLandmark, getCurrentSectionMark, getLandmarkY } from '@/lib/scrollUtils';
import { useLocation, useNavigate } from "../../lib/routeUtil";

const COMMENTS_TITLE_CLASS_NAME = 'CommentsTableOfContentsTitle';

const styles = (theme: ThemeType) => ({
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
  commentAuthor: {
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
})

const CommentsTableOfContentsInner = ({commentTree, answersTree, post, highlightDate, classes}: {
  commentTree?: CommentTreeNode<CommentsList>[],
  answersTree?: CommentTreeNode<CommentsList>[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  highlightDate: Date|undefined,
  classes: ClassesType<typeof styles>,
}) => {
  const flattenedComments = flattenCommentTree([
    ...(answersTree ?? []),
    ...(commentTree ?? [])
  ]);
  const { landmarkName: highlightedLandmarkName } = useScrollHighlight(
    flattenedComments.map(comment => commentIdToLandmark(comment._id))
  );

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

  if (flattenedComments.length === 0) {
    return null;
  }
  
  if (!commentsTableOfContentsEnabled) {
    return null;
  }

  return <div className={classes.root}>
    <a id="comments-table-of-contents" href="#" className={classNames(
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

    {answersTree && answersTree.map(answer => <>
      <ToCCommentBlock
        key={answer.item._id}
        commentTree={answer} indentLevel={1} classes={classes}
        highlightedCommentId={highlightedLandmarkName}
        highlightDate={highlightDate}
      />
      <Components.TableOfContentsDivider/>
    </>)}
    {commentTree && commentTree.map(comment => <ToCCommentBlock
      key={comment.item._id}
      commentTree={comment}
      indentLevel={1}
      highlightDate={highlightDate}
      highlightedCommentId={highlightedLandmarkName}
      classes={classes}
    />)}
  </div>
}

const ToCCommentBlock = ({commentTree, indentLevel, highlightedCommentId, highlightDate, classes}: {
  commentTree: CommentTreeNode<CommentsList>,
  indentLevel: number,
  highlightedCommentId: string|null,
  highlightDate: Date|undefined,
  classes: ClassesType<typeof styles>,
}) => {
  const { UsersNameDisplay, TableOfContentsRow } = Components;
  const navigate = useNavigate();
  const location = useLocation();
  const { query } = location;
  const comment = commentTree.item;
  
  const score = forumTypeSetting.get() === "AlignmentForum"
    ? comment.afBaseScore
    : comment.baseScore;
  
  return <div>
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
          search: isEmpty(query) ? '' : `?${qs.stringify(query)}`,
          hash: `#${comment._id}`,
        });
        ev.stopPropagation();
        ev.preventDefault();
      }}
    >
      <span className={classNames(classes.comment, {
        [classes.highlightUnread]: highlightDate && new Date(comment.postedAt) > new Date(highlightDate),
      })}>
        <span className={classes.commentKarma}>{score}</span>
        <span className={classes.commentAuthor}>
          {comment.deleted
            ? <span>[comment deleted]</span>
            : <UsersNameDisplay user={comment.user} simple/>
          }
        </span>
      </span>
    </TableOfContentsRow>
    
    {commentTree.children.map(child =>
      <ToCCommentBlock
        key={child.item._id}
        highlightedCommentId={highlightedCommentId}
        highlightDate={highlightDate}
        commentTree={child}
        indentLevel={indentLevel+1}
        classes={classes}
      />
    )}
  </div>
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


export const CommentsTableOfContents = registerComponent('CommentsTableOfContents', CommentsTableOfContentsInner, { styles });

declare global {
  interface ComponentTypes {
    CommentsTableOfContents: typeof CommentsTableOfContents
  }
}
