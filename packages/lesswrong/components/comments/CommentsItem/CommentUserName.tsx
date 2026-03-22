import React from 'react';
import classNames from 'classnames';
import UserNameDeleted from "../../users/UserNameDeleted";
import UsersName from "../../users/UsersName";
import type { Placement as PopperPlacementType } from "popper.js";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const PROFILE_IMAGE_SIZE = 20;

const styles = defineStyles("CommentUserName", (theme: ThemeType) => ({
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
}), {stylePriority: 100});

const CommentUserName = ({
  comment,
  simple = false,
  className,
  tooltipPlacement,
}: {
  comment: CommentsList,
  simple?: boolean,
  className?: string,
  tooltipPlacement?: PopperPlacementType,
}) => {
  const classes = useStyles(styles);
  const author = comment.user;

  if (comment.deleted) {
    return <span className={className}>[comment deleted]</span>
  } else if (comment.hideAuthor || !author || author.deleted) {
    return <span className={className}>
      <UserNameDeleted userShownToAdmins={author} />
    </span>
  } else if (comment.answer) {
    return (
      <span className={classNames(className, classes.authorAnswer)}>
        Answer by <UsersName 
          user={author} 
          simple={simple}
          tooltipPlacement={tooltipPlacement}
        />
      </span>
    );
  }

  return (
    <UsersName
      user={author}
      simple={simple}
      className={classNames(className, classes.author)}
      tooltipPlacement={tooltipPlacement ?? "bottom-start"}
    />
  );
}

export default CommentUserName;


