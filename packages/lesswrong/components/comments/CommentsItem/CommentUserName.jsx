import { registerComponent, Components } from 'meteor/vulcan:core';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
  author: {
    ...theme.typography.body2,
    fontWeight: 600,
    marginRight: 10
  },
  authorAnswer: {
    ...theme.typography.body2,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontWeight: 600,
    marginRight: 10,
    '& a, & a:hover': {
      textShadow:"none",
      backgroundImage: "none"
    }
  },
});

const CommentUserName = ({comment, classes}) => {
  return comment.deleted || comment.hideAuthor || !comment.user ?
    ((comment.hideAuthor || !comment.user) ? <span>[deleted]  </span> : <span> [comment deleted]  </span>) :
      <span>
      {!comment.answer ? <span className={classes.author}>
          <Components.UsersName user={comment.user}/>
        </span>
        :
        <span className={classes.authorAnswer}>
          Answer by <Components.UsersName user={comment.user}/>
        </span>
      }
      </span>
}

registerComponent('CommentUserName', CommentUserName,
  withStyles(styles, {name: "CommentUserName"}));