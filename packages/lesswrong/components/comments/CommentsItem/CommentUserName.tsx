import { registerComponent } from '../../../lib/vulcan-lib/components';
import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { userGetProfileUrl } from '../../../lib/collections/users/helpers';
import { Link } from '../../../lib/reactRouterWrapper';
import { userHasCommentProfileImages } from '../../../lib/betas';
import { useCurrentUser } from '../../common/withUser';
import { isFriendlyUI } from '../../../themes/forumTheme';
import UserNameDeleted from "../../users/UserNameDeleted";
import UsersName from "../../users/UsersName";
import UsersProfileImage from "../../users/UsersProfileImage";
import UserTooltip from "../../users/UserTooltip";

const PROFILE_IMAGE_SIZE = 20;

const styles = (theme: ThemeType) => ({
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
  classes: ClassesType<typeof styles>,
  simple?: boolean,
  className?: string
}) => {
  const currentUser = useCurrentUser();
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
    // FIXME: Unstable component will lose state on rerender
    // eslint-disable-next-line react/no-unstable-nested-components
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

export default registerComponent('CommentUserName', CommentUserName, {
  styles,
  stylePriority: 100, //Higher than UsersName, which gets a className from us
});


