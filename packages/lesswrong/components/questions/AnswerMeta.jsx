import { Components, registerComponent } from 'meteor/vulcan:core';
import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles'
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';

const styles = theme => ({
  root: {
    marginTop: 10,
  },
  menuIcon: {
    cursor: "pointer",
    marginTop: theme.spacing.unit,
    color: theme.palette.grey[400]
  }
})

const AnswerMeta = ({classes, comment, post, showEdit}) => {
  const { CommentsVote, CommentsMenu } = Components

  return <div className={classes.root}>
    <CommentsVote comment={comment} />
    <CommentsMenu
      showEdit={showEdit}
      comment={comment}
      post={post}
      icon={<MoreHorizIcon className={classes.menuIcon}/>}
    />
  </div>
};

AnswerMeta.propTypes = {
  classes: PropTypes.object.isRequired,
  post: PropTypes.object.isRequired,
  comment: PropTypes.object.isRequired,
  showEdit: PropTypes.func,
};

registerComponent('AnswerMeta', AnswerMeta, withStyles(styles, {name: "AnswerMeta"}));
