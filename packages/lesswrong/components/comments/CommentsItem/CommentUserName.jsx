import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  author: {
    ...theme.typography.body1,
    fontWeight: 600,
    marginRight: 10
  },
  authorAnswer: {
    ...theme.typography.body1,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontWeight: 600,
    marginRight: 10,
    '& a, & a:hover': {
      textShadow:"none",
      backgroundImage: "none"
    }
  },
});

const CommentUserName = ({comment, classes, simple = false}) => {
  if (comment.deleted) {
    return <span>[comment deleted]</span>
  } else if (comment.hideAuthor || !comment.user) {
    return <Components.UserNameDeleted/>
  } else if (comment.answer) {
    return (
      <span className={classes.authorAnswer}>
        Answer by <Components.UsersName user={comment.user} simple={simple}/>
      </span>
    );
  } else {
    return (
      <span className={classes.author}>
        <Components.UsersName user={comment.user} simple={simple}/>
      </span>
    );
  }
}

registerComponent('CommentUserName', CommentUserName,
  withStyles(styles, {name: "CommentUserName"}));