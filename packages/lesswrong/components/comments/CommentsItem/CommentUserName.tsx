import { registerComponent } from '../../../lib/vulcan-lib/components';
import React, { ReactNode } from 'react';
import classNames from 'classnames';
import { userGetProfileUrl } from '../../../lib/collections/users/helpers';
import { Link } from '../../../lib/reactRouterWrapper';
import { userHasCommentProfileImages } from '../../../lib/betas';
import { useFilteredCurrentUser } from '../../common/withUser';
import { isFriendlyUI } from '../../../themes/forumTheme';
import UserNameDeleted from "../../users/UserNameDeleted";
import UsersName from "../../users/UsersName";
import UsersNameWithModal from "../../ultraFeed/UsersNameWithModal";
import UsersProfileImage from "../../users/UsersProfileImage";
import UserTooltip from "../../users/UserTooltip";
import type { Placement as PopperPlacementType } from "popper.js";

const PROFILE_IMAGE_SIZE = 20;

const styles = (theme: ThemeType) => ({
  author: {
    ...theme.typography.body2,
    fontWeight: 600,
    ...(theme.isFriendlyUI && {
      marginRight: 2,
    }),
  },
  authorAnswer: {
    ...theme.typography.body2,
    fontFamily: theme.isFriendlyUI
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
  useUltraFeedModal = false,
  tooltipPlacement,
}: {
  comment: CommentsList,
  classes: ClassesType<typeof styles>,
  simple?: boolean,
  className?: string,
  useUltraFeedModal?: boolean,
  tooltipPlacement?: PopperPlacementType,
}) => {
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
  } else if (isFriendlyUI()) {
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
        {currentUserHasProfileImages
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
    <UserNameComponent
      user={author}
      simple={simple}
      className={classNames(className, classes.author)}
      tooltipPlacement={tooltipPlacement ?? "bottom-start"}
    />
  );
}

export default registerComponent('CommentUserName', CommentUserName, {
  styles,
  stylePriority: 100, //Higher than UsersName, which gets a className from us
});


