import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { isNewUser } from "../../lib/collections/users/helpers";
import { siteNameWithArticleSetting } from "../../lib/instanceSettings";
import { isFriendlyUI } from "../../themes/forumTheme";
import { tenPercentPledgeDiamond } from "../ea-forum/users/DisplayNameWithMarkers";
import { weightedRandomPick } from "@/lib/abTestImpl";
import classNames from "classnames";

const styles = (theme: ThemeType) => ({
  iconWrapper: {
    margin: "0 3px",
  },
  tenPercentPledge: {
    color: 'black', // Override transparency
    fontSize: 16,
    // Tweak the styling because this is a string rather than an svg
    textAlign: 'center',
    transform: 'translateY(-1px)',
    margin: '0 1px'
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

const UserCommentMarkers = ({
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
  // Add the diamond for 50% of users
  const showTenPercentPledgeDiamond =
    user.displayName && weightedRandomPick({ pledger: 1, "non-pledger": 1 }, user.displayName) === "pledger";

  if (!showAuthorIcon && !showNewUserIcon && !showTenPercentPledgeDiamond) {
    return null;
  }

  const {LWTooltip, ForumIcon} = Components;
  return (
    <span className={className}>
      {showTenPercentPledgeDiamond &&
        <LWTooltip
          placement="bottom-start"
          title={`${user.displayName} has taken the ${tenPercentPledgeDiamond}10% Pledge`}
          className={classNames(classes.iconWrapper, classes.tenPercentPledge)}
        >
          {tenPercentPledgeDiamond}
        </LWTooltip>
      }
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
