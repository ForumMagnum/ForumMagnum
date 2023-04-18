import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import classNames from 'classnames';
import { isEAForum } from '../../../lib/instanceSettings';

const styles = (theme: ThemeType): JssStyles => ({
  author: {
    ...theme.typography.body2,
    fontWeight: 600,
  },
  authorAnswer: {
    ...theme.typography.body2,
    fontFamily: isEAForum
      ? theme.palette.fonts.sansSerifStack
      : theme.typography.postStyle.fontFamily,
    fontWeight: 600,
    '& a, & a:hover': {
      textShadow:"none",
      backgroundImage: "none"
    }
  },
  iconWrapper: {
    marginLeft: -4,
    marginRight: 10,
  },
  postAuthorIcon: {
    verticalAlign: 'text-bottom',
    color: theme.palette.grey[500],
    fontSize: 16,
  },
  sproutIcon: {
    position: 'relative',
    bottom: -2,
    color: theme.palette.icon.sprout,
    fontSize: 16,
  }
});

const CommentUserName = ({comment, classes, simple = false, isPostAuthor, hideSprout, className}: {
  comment: CommentsList,
  classes: ClassesType,
  simple?: boolean,
  isPostAuthor?: boolean,
  hideSprout?: boolean,
  className?: string
}) => {
  const { UserNameDeleted, UsersName } = Components
  const author = comment.user
  
  if (comment.deleted) {
    return <span className={className}>[comment deleted]</span>
  } else if (comment.hideAuthor || !author || author.deleted) {
    return <span className={className}>
      <UserNameDeleted userShownToAdmins={author} />
    </span>
  } else if (comment.answer) {
    return (
      <span className={classNames(className, classes.authorAnswer)}>
        Answer by <UsersName user={author} simple={simple}/>
      </span>
    );
  } else {
    return <>
      <UsersName
        user={author}
        simple={simple}
        allowNewUserIcon={!hideSprout}
        showAuthorIcon={isEAForum && isPostAuthor}
        className={classNames(className, classes.author)}
        tooltipPlacement="bottom-start"
      />
    </>
  }
}

const CommentUserNameComponent = registerComponent('CommentUserName', CommentUserName, {
  styles,
  stylePriority: 100, //Higher than UsersName, which gets a className from us
});

declare global {
  interface ComponentTypes {
    CommentUserName: typeof CommentUserNameComponent
  }
}
