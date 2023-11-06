import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { CommentTreeNode } from '../../lib/utils/unflatten';
import { getCurrentSectionMark, getLandmarkY, ScrollHighlightLandmark, useScrollHighlight } from '../hooks/useScrollHighlight';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import isEmpty from 'lodash/isEmpty';
import qs from 'qs'
import { isLWorAF } from '../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    color: theme.palette.text.dim,
  },
  comment: {
    display: "inline-flex",
  },
  commentKarma: {
    width: 20,
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
    paddingTop: 4,
  },
})

const CommentsTableOfContents = ({commentTree, answersTree, post, classes}: {
  commentTree?: CommentTreeNode<CommentsList>[],
  answersTree?: CommentTreeNode<CommentsList>[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  classes: ClassesType,
}) => {
  const { TableOfContentsRow } = Components;
  const flattenedComments = flattenCommentTree([
    ...(answersTree ?? []),
    ...(commentTree ?? [])
  ]);
  const { landmarkName: highlightedLandmarkName } = useScrollHighlight(
    flattenedComments.map(comment => commentIdToLandmark(comment._id))
  );
  
  if (!isLWorAF) {
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
    >
      <div className={classes.postTitle}>
        {post.title?.trim()}
      </div>
    </TableOfContentsRow>

    {answersTree && answersTree.map(answer => <>
      <ToCCommentBlock
        key={answer.item._id}
        commentTree={answer} indentLevel={1} classes={classes}
        highlightedCommentId={highlightedLandmarkName}
      />
      <Components.TableOfContentsDivider/>
    </>)}
    {commentTree && commentTree.map(comment => comment.item
      ? <ToCCommentBlock
          key={comment.item._id}
          commentTree={comment} indentLevel={1} classes={classes}
          highlightedCommentId={highlightedLandmarkName}
        />
      : null
    )}
  </div>
}

function commentIdToLandmark(commentId: string): ScrollHighlightLandmark {
  return {
    landmarkName: commentId,
    elementId: commentId,
    position: "topOfElement",
    offset: 25, //approximate distance from top-border of a comment to the center of the metadata line
  }
}

const ToCCommentBlock = ({commentTree, indentLevel, highlightedCommentId, classes}: {
  commentTree: CommentTreeNode<CommentsList>,
  indentLevel: number,
  highlightedCommentId: string|null,
  classes: ClassesType,
}) => {
  const { TableOfContentsRow } = Components;
  const { history } = useNavigation();
  const location = useLocation();
  const { query } = location;
  const comment = commentTree.item!;
  
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
        history.push({
          search: isEmpty(query) ? '' : `?${qs.stringify(query)}`,
          hash: `#${comment._id}`,
        });
        ev.stopPropagation();
        ev.preventDefault();
      }}
    >
      <span className={classes.comment}>
        <span className={classes.commentKarma}>{comment.baseScore}</span>
        <span className={classes.commentAuthor}>{comment.user?.displayName}</span>
      </span>
    </TableOfContentsRow>
    
    {commentTree.children.map(child =>
      <ToCCommentBlock
        key={child.item._id}
        highlightedCommentId={highlightedCommentId}
        commentTree={child} indentLevel={indentLevel+1} classes={classes}
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
