import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React from 'react';
import classNames from 'classnames';
import { isEAForum } from '../../../lib/instanceSettings';
import { userGetProfileUrl } from '../../../lib/collections/users/helpers';
import { Link } from '../../../lib/reactRouterWrapper';

const PROFILE_IMAGE_SIZE = 20;

const styles = (theme: ThemeType): JssStyles => ({
  author: {
    ...theme.typography.body2,
    fontWeight: 600,
    ...(isEAForum && {
      marginRight: 2,
    }),
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
    padding: "1px 4px",
    "&:hover": {
      background: theme.palette.grey[300],
    },
  },
  profileImage: {
    minWidth: PROFILE_IMAGE_SIZE,
    marginLeft: 4,
    marginRight: 6,
    transform: "translateY(2px)",
    ["@media screen and (max-width: 290px)"]: {
      display: "none",
    },
  },
});

const CommentUserName = ({
  comment,
  classes,
  simple = false,
  isPostAuthor,
  hideSprout,
  className,
  imageClassName,
}: {
  comment: CommentsList,
  classes: ClassesType,
  simple?: boolean,
  isPostAuthor?: boolean,
  hideSprout?: boolean,
  className?: string
  imageClassName?: string,
}) => {
  const {UserNameDeleted, UsersName, UsersProfileImage, UserTooltip} = Components
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
        Answer by <UsersName user={author} simple={simple}/>
      </span>
    );
  } else if (isEAForum) {
    const Wrapper = ({children}) => simple
      ? (
        <div className={classes.mainWrapper}>
          {children}
        </div>
      )
      : (
        <UserTooltip user={author}>
          <Link
            to={userGetProfileUrl(author)}
            className={classNames(classes.mainWrapper, classes.fullWrapper, className)}
          >
            {children}
          </Link>
        </UserTooltip>
      );
    return (
      <Wrapper>
        <UsersProfileImage
          user={author}
          size={PROFILE_IMAGE_SIZE}
          fallback="initials"
          className={classNames(classes.profileImage, imageClassName)}
        />
        <UsersName
          user={author}
          allowNewUserIcon={!hideSprout}
          showAuthorIcon={isEAForum && isPostAuthor}
          className={classes.author}
          color
          noTooltip
        />
      </Wrapper>
    );
  }

  return (
    <UsersName
      user={author}
      simple={simple}
      allowNewUserIcon={!hideSprout}
      showAuthorIcon={isEAForum && isPostAuthor}
      className={classNames(className, classes.author)}
      tooltipPlacement="bottom-start"
    />
  );
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
