import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import withHover from '../common/withHover';
import withUser from '../common/withUser';
import SubdirectoryArrowLeft from '@material-ui/icons/SubdirectoryArrowLeft';

const styles = theme => ({
  root: {
    paddingLeft: theme.spacing.unit,
    paddingTop: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
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

const ShowParentComment = ({currentUser, comment, classes, nestingLevel, hover}) => {
  if (!comment.parentCommentId || (nestingLevel !== 1)) return null

  // const { RecentCommentsSingle } = Components

  return (
    <span className={classes.root}>
      <SubdirectoryArrowLeft className={classes.icon}>
        subdirectory_arrow_left
      </SubdirectoryArrowLeft>
      {/* {hover && <span className={classes.parentComment}>
        <RecentCommentsSingle 
          currentUser={currentUser}
          documentId={comment.parentCommentId}
          level={nestingLevel + 1}
          expanded={true}
          key={comment.parentCommentId}
        />
      </span>} */}
    </span>

  )
};

registerComponent('ShowParentComment', ShowParentComment, withStyles(styles, {name:"ShowParentComment"}), withHover, withUser);
