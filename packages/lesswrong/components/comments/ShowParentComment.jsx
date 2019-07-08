import { registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import SubdirectoryArrowLeft from '@material-ui/icons/SubdirectoryArrowLeft';
import Tooltip from '@material-ui/core/Tooltip';

const styles = theme => ({
  root: {
    paddingRight: theme.spacing.unit,
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    cursor: "pointer",
    color: "rgba(0,0,0,.75)",
  },
  active: {
    color: "rgba(0,0,0, .3)",
  },
  icon: {
    fontSize: 12,
    transform: "rotate(90deg)"
  },
  parentComment: {
    background: "white",
    position: "absolute",
    zIndex: 2,
    maxWidth: 650,
    bottom: "100%",
    left: 0,
    boxShadow: "0 0 10px rgba(0,0,0,.2)"
  }
})

const ShowParentComment = ({ comment, nestingLevel, active, onClick, classes }) => {

  if (!comment) return null;
  
  if (!comment.topLevelCommentId) {
    // This is a root comment
    return null;
  }
  
  // As a weird special case for shortform, a comment tree can be rendered
  // with the root comment shown, a deep-in-tree comment shown, and the
  // intermediate parents hidden, ie
  //     [shortform-comment]
  //       [hidden]
  //         [hidden]
  //           [deep reply]
  // In that case the deep reply has nestingLevel 2, but unlike a true level-2
  // comment, its parent is not a top-level comment.
  if (nestingLevel > 2) {
    return null;
  }
  
  if (nestingLevel === 2
    && comment.parentCommentId === comment.topLevelCommentId
  ) {
    return null
  }

  return (
    <Tooltip title="Show previous comment">
      <span className={classNames(classes.root, {[classes.active]: active})} onClick={onClick}>
        <SubdirectoryArrowLeft className={classes.icon}>
          subdirectory_arrow_left
        </SubdirectoryArrowLeft>
      </span>
    </Tooltip>
  )
};

registerComponent('ShowParentComment', ShowParentComment, withStyles(styles, {name:"ShowParentComment"}));
