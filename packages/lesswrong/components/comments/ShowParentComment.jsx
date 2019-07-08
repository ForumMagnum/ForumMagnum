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
    cursor: "pointer"
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

const ShowParentComment = ({ comment, classes, nestingLevel, onClick }) => {

  if (!comment) return null;
  
  if (!comment.topLevelCommentId) {
    // This is a root comment
    return null;
  }
  
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
      <span className={classes.root} onClick={onClick}>
        <SubdirectoryArrowLeft className={classes.icon}>
          subdirectory_arrow_left
        </SubdirectoryArrowLeft>
      </span>
    </Tooltip>
  )
};

registerComponent('ShowParentComment', ShowParentComment, withStyles(styles, {name:"ShowParentComment"}));
