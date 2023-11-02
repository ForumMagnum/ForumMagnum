import React, { useState } from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { CommentTreeNode } from '../../lib/utils/unflatten';
import { ToCSection } from '../../lib/tableOfContents';
import { useScrollHighlight } from '../hooks/useScrollHighlight';
import ArrowDropDown from '@material-ui/icons/ArrowDropDown';
import classNames from 'classnames';
import { getCurrentSectionMark } from '../posts/TableOfContents/TableOfContentsList';
import { useLocation, useNavigation } from '../../lib/routeUtil';
import isEmpty from 'lodash/isEmpty';
import qs from 'qs'

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
  titleAndCollapseButton: {
    display: "flex",
    alignItems: "end",
  },
  postTitle: {
    flexGrow: 1,
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
  const [collapsed,setCollapsed] = useState(false);
  const flattenedComments = flattenCommentTree([
    ...(answersTree ?? []),
    ...(commentTree ?? [])
  ]);
  const { landmarkName: highlightedLandmarkName } = useScrollHighlight(
    flattenedComments.map(comment => ({
      landmarkName: comment._id,
      elementId: comment._id,
      position: "topOfElement"
    }))
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
      highlighted={highlightedLandmarkName==="above"}
      title
    >
      <div className={classes.titleAndCollapseButton}>
        <div className={classes.postTitle}>
          {post.title?.trim()}
        </div>
        
        <div
          className={classes.collapseButtonWrapper}
          onClick={ev => {
            setCollapsed(!collapsed);
            ev.preventDefault();
            ev.stopPropagation();
          }
        }>
          <ArrowDropDown className={classNames(
            classes.collapseButton, {
              [classes.collapseButtonExpanded]: !collapsed,
              [classes.collapseButtonCollapsed]: collapsed,
          })}/>
        </div>
      </div>
    </TableOfContentsRow>

    {!collapsed && answersTree && answersTree.map(answer => <>
      <ToCCommentBlock
        key={answer.item._id}
        commentTree={answer} indentLevel={1} classes={classes}
        highlightedCommentId={highlightedLandmarkName}
      />
      <Components.TableOfContentsDivider/>
    </>)}
    {!collapsed && commentTree && commentTree.map(comment => comment.item
      ? <ToCCommentBlock
          key={comment.item._id}
          commentTree={comment} indentLevel={1} classes={classes}
          highlightedCommentId={highlightedLandmarkName}
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
        let anchor = window.document.getElementById(comment._id);
        if (anchor) {
          let anchorBounds = anchor.getBoundingClientRect();
          const y = anchorBounds.top + window.scrollY - getCurrentSectionMark() + 1;
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


const CommentsTableOfContentsComponent = registerComponent('CommentsTableOfContents', CommentsTableOfContents, {styles});

declare global {
  interface ComponentTypes {
    CommentsTableOfContents: typeof CommentsTableOfContentsComponent
  }
}
