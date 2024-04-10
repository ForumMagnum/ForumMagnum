import { registerComponent, Components } from '../../../lib/vulcan-lib';
import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { userGetProfileUrl } from '../../../lib/collections/users/helpers';
import { Link } from '../../../lib/reactRouterWrapper';
import { userHasCommentProfileImages } from '../../../lib/betas';
import { useCurrentUser } from '../../common/withUser';
import { isFriendlyUI } from '../../../themes/forumTheme';

const PROFILE_IMAGE_SIZE = 20;

const styles = (theme: ThemeType): JssStyles => ({
  author: {
    ...theme.typography.body2,
    fontWeight: 600,
    ...(isFriendlyUI && {
      marginRight: 2,
    }),
  },
  authorAnswer: {
    ...theme.typography.body2,
    fontFamily: isFriendlyUI
      ? theme.palette.fonts.sansSerifStack
      : theme.typography.postStyle.fontFamily,
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
});

const CommentUserName = ({
  comment,
  classes,
  simple = false,
  className,
}: {
  comment: CommentsList,
  classes: ClassesType,
  simple?: boolean,
  className?: string
}) => {
  const currentUser = useCurrentUser();
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
  } else if (isFriendlyUI) {
    const Wrapper = ({children}: {children: ReactNode}) => simple
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
        {userHasCommentProfileImages(currentUser)
          ? <UsersProfileImage
            user={author}
            size={PROFILE_IMAGE_SIZE}
            fallback="initials"
            className={classes.profileImage}
          />
          : <div className={classes.profileImagePlaceholder} />
        }
        <UsersName
          user={author}
          className={classes.author}
          simple
          color
        />
      </Wrapper>
    );
  }

  return (
    <UsersName
      user={author}
      simple={simple}
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
