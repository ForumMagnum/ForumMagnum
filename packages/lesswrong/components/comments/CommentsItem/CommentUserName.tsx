import React from 'react';
import classNames from 'classnames';
import { userHasCommentProfileImages } from '../../../lib/betas';
import { useFilteredCurrentUser } from '../../common/withUser';
import UserNameDeleted from "../../users/UserNameDeleted";
import UsersName from "../../users/UsersName";
import UsersNameWithModal from "../../ultraFeed/UsersNameWithModal";
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
  mainWrapper: {
    display: "flex",
    alignItems: "center",
    "&:hover": {
      opacity: 1,
    },
    "& a:hover": {
      opacity: 1,
    },
  },
  fullWrapper: {
    borderRadius: theme.borderRadius.default,
    height: 26, // match height of vote buttons
    padding: "1px 4px 1px 2px",
    marginLeft: -6,
    "&:hover": {
      background: theme.palette.grey[300],
    },
  },
  profileImage: {
    minWidth: PROFILE_IMAGE_SIZE,
    marginLeft: 4,
    marginRight: 6,
    ["@media screen and (max-width: 290px)"]: {
      display: "none",
    },
  },
  profileImagePlaceholder: {
    marginRight: 4,
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
  const currentUserHasProfileImages = useFilteredCurrentUser(u => userHasCommentProfileImages(u));
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


