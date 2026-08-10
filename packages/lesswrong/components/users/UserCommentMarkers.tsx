import React from "react";
import { isNewUser } from "../../lib/collections/users/helpers";
import { siteNameWithArticleSetting } from "../../lib/instanceSettings";
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("UserCommentMarkers", (theme: ThemeType) => ({
  iconWrapper: {
    margin: "0 3px",
  },
  sproutIcon: {
    position: "relative",
    bottom: -2,
    color: theme.palette.icon.sprout,
    fontSize: 16,
  },
}));

const UserCommentMarkers = ({user, className}: {
  user?: UsersMinimumInfo|null,
  className?: string,
}) => {
  const classes = useStyles(styles);

  if (!user) {
    return null;
  }

  const showNewUserIcon = isNewUser(user);

  if (!showNewUserIcon) {
    return null;
  }
  return (
    <span className={className}>
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

export default UserCommentMarkers;


