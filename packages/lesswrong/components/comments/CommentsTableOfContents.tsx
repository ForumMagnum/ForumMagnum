import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { CommentTreeNode } from '../../lib/utils/unflatten';
import { getCurrentSectionMark, getLandmarkY, ScrollHighlightLandmark, useScrollHighlight } from '../hooks/useScrollHighlight';
import { useLocation } from '../../lib/routeUtil';
import isEmpty from 'lodash/isEmpty';
import qs from 'qs'
import { commentsTableOfContentsEnabled } from '../../lib/betas';
import { useNavigate } from '../../lib/reactRouterWrapper';
import classNames from 'classnames';
import { forumTypeSetting } from '@/lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
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
    minHeight: 24,
    paddingTop: 16,
    ...theme.typography.postStyle,
    ...theme.typography.smallCaps,
    fontSize: "1.3rem",
    marginBottom: -6,
    display: 'block'
  },
  tocPostedAt: {
    color: theme.palette.link.tocLink
  },
  highlightUnread: {
    paddingLeft: 4,
    marginLeft: -7,
    borderLeft: `solid 3px ${theme.palette.secondary.main}`
  },
})

const CommentsTableOfContents = ({commentTree, answersTree, post, highlightDate, classes}: {
  commentTree?: CommentTreeNode<CommentsList>[],
  answersTree?: CommentTreeNode<CommentsList>[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  highlightDate: Date|undefined,
  classes: ClassesType,
}) => {
  const { TableOfContentsRow, FormatDate } = Components;
  const flattenedComments = flattenCommentTree([
    ...(answersTree ?? []),
    ...(commentTree ?? [])
  ]);
  const { landmarkName: highlightedLandmarkName } = useScrollHighlight(
    flattenedComments.map(comment => commentIdToLandmark(comment._id))
  );

  if (flattenedComments.length === 0) return null;
  
  if (!commentsTableOfContentsEnabled) {
    return null;
  }
  
  return <div className={classes.root}>
    <TableOfContentsRow key="postTitle"
      href="#"
      onClick={ev => {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }}
      highlighted={highlightedLandmarkName==="above"}
      title
      fullHeight
      commentToC
    >
      <span className={classes.postTitle}>
        {post.title?.trim()}
      </span>
    </TableOfContentsRow>

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

export function commentIdToLandmark(commentId: string): ScrollHighlightLandmark {
  return {
    landmarkName: commentId,
    elementId: commentId,
    position: "topOfElement",
    offset: 25, //approximate distance from top-border of a comment to the center of the metadata line
  }
}

const ToCCommentBlock = ({commentTree, indentLevel, highlightedCommentId, highlightDate, classes}: {
  commentTree: CommentTreeNode<CommentsList>,
  indentLevel: number,
  highlightedCommentId: string|null,
  highlightDate: Date|undefined,
  classes: ClassesType,
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
          window.scrollTo({ top: y });
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
          <UsersNameDisplay user={comment.user} simple/>
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


const CommentsTableOfContentsComponent = registerComponent('CommentsTableOfContents', CommentsTableOfContents, { styles });

declare global {
  interface ComponentTypes {
    CommentsTableOfContents: typeof CommentsTableOfContentsComponent
  }
}
