import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { isNewUser } from "../../lib/collections/users/helpers";
import { siteNameWithArticleSetting } from "../../lib/instanceSettings";
import { isFriendlyUI } from "../../themes/forumTheme";
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";

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
  donationIcon: {
    position: "relative",
    bottom: -1,
    color: theme.palette.givingSeason.primary,
    fontSize: 16,
  },
  votedIcon: {
    position: "relative",
    bottom: -3,
    color: theme.palette.givingSeason.primary,
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
  const showDonatedIcon = user.givingSeason2025DonatedFlair;
  const showVotedIcon = user.givingSeason2025VotedFlair;

  if (!showAuthorIcon && !showNewUserIcon && !showDonatedIcon && !showVotedIcon) {
    return null;
  }
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
      {showDonatedIcon &&
        <LWTooltip
          placement="bottom-start"
          title="Donated to the Donation Election fund"
          className={classes.iconWrapper}
        >
          <ForumIcon icon="GivingHand" className={classes.donationIcon} />
        </LWTooltip>
      }
      {showVotedIcon &&
        <LWTooltip
          placement="bottom-start"
          title="Voted in the Donation Election"
          className={classes.iconWrapper}
        >
          <ForumIcon icon="Voted" className={classes.votedIcon} />
        </LWTooltip>
      }
    </span>
  );
}

export default registerComponent(
  "UserCommentMarkers",
  UserCommentMarkers,
  {styles},
);


