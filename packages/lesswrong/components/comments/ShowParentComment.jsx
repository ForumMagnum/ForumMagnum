import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import withHover from '../common/withHover';
import SubdirectoryArrowLeft from '@material-ui/icons/SubdirectoryArrowLeft';

const styles = theme => ({
  icon: {
    fontSize: 12,
    transform: "rotate(90deg)"
  },
})

const ShowParentComment = ({comment, classes, nestingLevel, hover, anchorEl}) => {

  if (!comment.parentCommentId || (nestingLevel !== 1)) return null

  return (
    <SubdirectoryArrowLeft className={classes.icon}>
      subdirectory_arrow_left
    </SubdirectoryArrowLeft>
  )
};

registerComponent('ShowParentComment', ShowParentComment, withStyles(styles, {name:"ShowParentComment"}), withHover);
