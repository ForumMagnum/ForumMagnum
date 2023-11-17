import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { isEAForum, siteNameWithArticleSetting } from "../../lib/instanceSettings";
import { isNewUser, showDonatedIcon } from "../../lib/collections/users/helpers";

const styles = (theme: ThemeType): JssStyles => ({
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
  donationIcon: {
    position: "relative",
    bottom: -2,
    color: theme.palette.givingPortal[1000],
    fontSize: 16,
  },
});

const UserCommentMarkers = ({
  user,
  isPostAuthor,
  className,
  classes,
}: {
  user?: UsersMinimumInfo|null,
  isPostAuthor?: boolean,
  className?: string,
  classes: ClassesType,
}) => {
  if (!user) {
    return null;
  }

  const showAuthorIcon = isEAForum && isPostAuthor;
  const showNewUserIcon = isNewUser(user);
  const _showDonatedIcon = showDonatedIcon(user);

  if (!showAuthorIcon && !showNewUserIcon && !showDonatedIcon) {
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
      {_showDonatedIcon &&
        <LWTooltip
          placement="bottom-start"
          title={`Donated to the Donation Election fund`}
          className={classes.iconWrapper}
        >
          <ForumIcon icon="GivingHand" className={classes.donationIcon} />
        </LWTooltip>
      }
    </span>
  );
}

const UserCommentMarkersComponent = registerComponent(
  "UserCommentMarkers",
  UserCommentMarkers,
  {styles},
);

declare global {
  interface ComponentTypes {
    UserCommentMarkers: typeof UserCommentMarkersComponent
  }
}
