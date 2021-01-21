import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import classNames from 'classnames';

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

const CommentUserName = ({comment, classes, simple = false, className}: {
  comment: CommentsList,
  classes: ClassesType,
  simple?: boolean,
  className?: string
}) => {
  if (comment.deleted) {
    return <span className={className}>[comment deleted]</span>
  } else if (comment.hideAuthor || !comment.user) {
    return <span className={className}>
      <Components.UserNameDeleted/>
    </span>
  } else if (comment.answer) {
    return (
      <span className={classNames(className, classes.authorAnswer)}>
        Answer by <Components.UsersName user={comment.user} simple={simple}/>
      </span>
    );
  } else {
    return <Components.UsersName user={comment.user} simple={simple} className={classNames(className, classes.author)}/>
  }
}

const CommentUserNameComponent = registerComponent('CommentUserName', CommentUserName, {
  styles,
  stylePriority: 100, //Higher than Components.UsersName, which gets a className from us
});

declare global {
  interface ComponentTypes {
    CommentUserName: typeof CommentUserNameComponent
  }
}
