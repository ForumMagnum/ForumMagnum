import React, { useContext, useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { CommentTreeNode } from '../../lib/utils/unflatten';
import { ToCSection } from '../../lib/tableOfContents';

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

const CommentsTableOfContents = ({commentTree, highlightedSection, classes}: {
  commentTree?: CommentTreeNode<CommentsList>[],
  highlightedSection: string|null,
  classes: ClassesType,
}) => {
  return <div className={classes.root}>
    {commentTree && commentTree.map(comment => comment.item
      ? <ToCCommentBlock
        key={comment.item._id}
        commentTree={comment} indentLevel={1} classes={classes}

        highlightedSection={highlightedSection}
      />
      : null
    )}
  </div>
}

const ToCCommentBlock = ({commentTree, indentLevel, highlightedSection, classes}: {
  commentTree: CommentTreeNode<CommentsList>,
  indentLevel: number,
  highlightedSection: string|null,
  classes: ClassesType,
}) => {
  const { TableOfContentsRow } = Components;
  const comment = commentTree.item!;
  return <div>
    <TableOfContentsRow
      indentLevel={indentLevel}
      highlighted={highlightedSection===comment._id}
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
        highlightedSection={highlightedSection}
        commentTree={child} indentLevel={indentLevel+1} classes={classes}
      />
    )}
  </div>
}

function commentTreeToToCSections (commentTree: CommentTreeNode<CommentsList>[], level: number): ToCSection[] {
  let result: ToCSection[] = [];
  for (let comment of commentTree) {
    result.push({
      anchor: comment.item._id,
      level,
    });
    if (comment.children) {
      result = [...result, ...commentTreeToToCSections(comment.children, level+1)];
    }
  }
  return result;
}


const CommentsTableOfContentsComponent = registerComponent('CommentsTableOfContents', CommentsTableOfContents, {styles});

declare global {
  interface ComponentTypes {
    CommentsTableOfContents: typeof CommentsTableOfContentsComponent
  }
}
