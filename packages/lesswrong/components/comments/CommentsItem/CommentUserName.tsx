import React from 'react';
import classNames from 'classnames';
import UserNameDeleted from "../../users/UserNameDeleted";
import UsersName from "../../users/UsersName";
import UsersNameWithModal from "../../ultraFeed/UsersNameWithModal";
import ForumIcon from "../../common/ForumIcon";
import type { Placement as PopperPlacementType } from "popper.js";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const PROFILE_IMAGE_SIZE = 20;

const styles = defineStyles("CommentUserName", (theme: ThemeType) => ({
  author: {
    ...theme.typography.body2,
    fontWeight: 600,
  },
  llmAuthor: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    color: theme.palette.text.dim,
    fontFamily: '"cronos-pro", serif',
    fontVariant: "small-caps",
    "& a, & a:hover": {
      color: theme.palette.text.dim,
    },
  },
  llmIcon: {
    "--icon-size": "1em",
    flexShrink: 0,
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
  useUltraFeedModal = false,
  tooltipPlacement,
}: {
  comment: CommentsList,
  simple?: boolean,
  className?: string,
  useUltraFeedModal?: boolean,
  tooltipPlacement?: PopperPlacementType,
}) => {
  const classes = useStyles(styles);
  const author = comment.user;

  const UserNameComponent = useUltraFeedModal ? UsersNameWithModal : UsersName;

  if (comment.deleted) {
    return <span className={className}>[comment deleted]</span>
  } else if (comment.hideAuthor || !author || author.deleted) {
    return <span className={className}>
      <UserNameDeleted userShownToAdmins={author} />
    </span>
  } else if (comment.answer) {
    return (
      <span className={classNames(className, classes.authorAnswer)}>
        Answer by <UserNameComponent 
          user={author} 
          simple={simple}
          tooltipPlacement={tooltipPlacement}
        />
      </span>
    );
  }

  if (comment.llmRunId) {
    return (
      <span className={classNames(className, classes.author, classes.llmAuthor)}>
        <ForumIcon icon="Sparkles" className={classes.llmIcon} />
        <UserNameComponent
          user={author}
          simple={simple}
          tooltipPlacement={tooltipPlacement ?? "bottom-start"}
        />
      </span>
    );
  }

  return (
    <UserNameComponent
      user={author}
      simple={simple}
      className={classNames(className, classes.author)}
      tooltipPlacement={tooltipPlacement ?? "bottom-start"}
    />
  );
}

export default CommentUserName;


