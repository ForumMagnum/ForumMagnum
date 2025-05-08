import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { isNewUser } from "../../lib/collections/users/helpers";
import { siteNameWithArticleSetting } from "../../lib/instanceSettings";
import { isFriendlyUI } from "../../themes/forumTheme";

const styles = (theme: ThemeType) => ({
  iconWrapper: {
    margin: "0 3px",
  },
  postAuthorIcon: {
    verticalAlign: "text-bottom",
    color: theme.palette.grey[500],
    fontSize: 16,
  },
  sproutIcon: {
    position: "relative",
    bottom: -2,
    color: theme.palette.icon.sprout,
    fontSize: 16,
  },
});

const UserCommentMarkersInner = ({
  user,
  isPostAuthor,
  className,
  classes,
}: {
  user?: UsersMinimumInfo|null,
  isPostAuthor?: boolean,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  if (!user) {
    return null;
  }

  const showAuthorIcon = isFriendlyUI && isPostAuthor;
  const showNewUserIcon = isNewUser(user);

  if (!showAuthorIcon && !showNewUserIcon) {
    return null;
  }

  const {LWTooltip, ForumIcon} = Components;
  return (
    <span className={className}>
      {showAuthorIcon &&
        <LWTooltip
          placement="bottom-start"
          title="Post author"
          className={classes.iconWrapper}
        >
          <ForumIcon icon="Author" className={classes.postAuthorIcon} />
        </LWTooltip>
      }
      {showNewUserIcon &&
        <LWTooltip
          placement="bottom-start"
          title={`${user.displayName} is either new on ${siteNameWithArticleSetting.get()} or doesn't have much karma yet.`}
          className={classes.iconWrapper}
        >
          <ForumIcon icon="Sprout" className={classes.sproutIcon} />
        </LWTooltip>
      }
    </span>
  );
}

export const UserCommentMarkers = registerComponent(
  "UserCommentMarkers",
  UserCommentMarkersInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    UserCommentMarkers: typeof UserCommentMarkers
  }
}
