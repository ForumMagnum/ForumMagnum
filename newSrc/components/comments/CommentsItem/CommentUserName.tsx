import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';

const styles = (theme: ThemeType): JssStyles => ({
  author: {
    ...theme.typography.body2,
    fontWeight: 600,
  },
  authorAnswer: {
    ...theme.typography.body2,
    fontFamily: theme.typography.postStyle.fontFamily,
    fontWeight: 600,
    '& a, & a:hover': {
      textShadow:"none",
      backgroundImage: "none"
    }
  },
});

const CommentUserName = ({comment, classes, simple = false}: {
  comment: CommentsList,
  classes: ClassesType,
  simple?: boolean,
}) => {
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

const CommentUserNameComponent = registerComponent('CommentUserName', CommentUserName, {styles});

declare global {
  interface ComponentTypes {
    CommentUserName: typeof CommentUserNameComponent
  }
}
