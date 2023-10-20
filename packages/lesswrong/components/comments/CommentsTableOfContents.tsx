import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { CommentTreeNode } from '../../lib/utils/unflatten';
import { ToCSection } from '../../lib/tableOfContents';
import { useScrollHighlight } from '../hooks/useScrollHighlight';

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
})

const CommentsTableOfContents = ({commentTree, post, classes}: {
  commentTree?: CommentTreeNode<CommentsList>[],
  post: PostsWithNavigation | PostsWithNavigationAndRevision,
  classes: ClassesType,
}) => {
  const { TableOfContentsRow } = Components;
  const flattenedComments = commentTree ? flattenCommentTree(commentTree) : [];
  const { landmarkId: highlightedCommentId } = useScrollHighlight(
    flattenedComments.map(comment => ({elementId: comment._id, position: "topOfElement"}))
  );
  
  return <div className={classes.root}>
    <TableOfContentsRow key="postTitle"
      href="#"
      onClick={ev => {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }}
      highlighted={false}
      title
    >
      {post.title?.trim()}
    </TableOfContentsRow>
    {commentTree && commentTree.map(comment => comment.item
      ? <ToCCommentBlock
          key={comment.item._id}
          commentTree={comment} indentLevel={1} classes={classes}
          highlightedCommentId={highlightedCommentId}
        />
      : null
    )}
  </div>
}

const ToCCommentBlock = ({commentTree, indentLevel, highlightedCommentId, classes}: {
  commentTree: CommentTreeNode<CommentsList>,
  indentLevel: number,
  highlightedCommentId: string|null,
  classes: ClassesType,
}) => {
  const { TableOfContentsRow } = Components;
  const comment = commentTree.item!;
  
  return <div>
    <TableOfContentsRow
      indentLevel={indentLevel}
      highlighted={highlightedCommentId===comment._id}
      dense
      href={"#"+comment._id}
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


const CommentsTableOfContentsComponent = registerComponent('CommentsTableOfContents', CommentsTableOfContents, {styles});

declare global {
  interface ComponentTypes {
    CommentsTableOfContents: typeof CommentsTableOfContentsComponent
  }
}
