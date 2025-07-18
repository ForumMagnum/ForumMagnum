import React from "react";
import { registerComponent } from "../../../lib/vulcan-lib/components";
import { userGetEditUrl } from "../../../lib/vulcan-users/helpers";
import { userCanEditUser } from "../../../lib/collections/users/helpers";
import { useMessages } from "../../common/withMessages";
import { useCurrentUser } from "../../common/withUser";
import { Link } from "../../../lib/reactRouterWrapper";
import { separatorBulletStyles } from "../../common/SectionFooter";
import CopyToClipboard from "react-copy-to-clipboard";
import CopyIcon from "@/lib/vendor/@material-ui/icons/src/FileCopy";
import NewFeedButton from "../../rss/NewFeedButton";
import { Typography } from "../../common/Typography";
import LWTooltip from "../../common/LWTooltip";
import DialogGroup from "../../common/DialogGroup";

const styles = (theme: ThemeType) => ({
  links: {
    display: "flex",
    flexWrap: "wrap",
    color: theme.palette.lwTertiary.main,
    ...separatorBulletStyles(theme),
    marginTop: 20,
    marginBottom: 0,
  },
  copyLink: {
    verticalAlign: "text-top",
  },
  copyIcon: {
    color: theme.palette.primary.main,
    fontSize: 14,
    cursor: "pointer",
    "&:hover": {
      opacity: 0.5
    },
  },
  registerRssLink: {
    cursor: "pointer",
    "&:hover": {
      opacity: 0.5
    },
  },
});

const EAUsersProfileLinks = ({user, classes}: {
  user: UsersProfile,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const {flash} = useMessages();
  const hasLinks = currentUser?.isAdmin || userCanEditUser(currentUser, user);
  if (!hasLinks) {
    return null;
  }

  return (
    <Typography variant="body2" className={classes.links}>
      {currentUser?.isAdmin &&
        <div>
          <LWTooltip
            title="Click to copy userId"
            placement="bottom"
            className={classes.copyLink}
          >
            <CopyToClipboard
              text={user._id}
              onCopy={() => flash({messageString: "userId copied!"})}
            >
              <CopyIcon className={classes.copyIcon} />
            </CopyToClipboard>
          </LWTooltip>
        </div>
      }
      {currentUser?.isAdmin &&
        <div className={classes.registerRssLink}>
          <NewFeedButton user={user} />
        </div>
      }
      {currentUser && currentUser._id === user._id &&
        <Link to="/manageSubscriptions">
          Manage subscriptions
        </Link>
      }
      {userCanEditUser(currentUser, user) &&
        <Link to={userGetEditUrl(user)}>
          Account settings
        </Link>
      }
    </Typography>
  );
}

export default registerComponent(
  "EAUsersProfileLinks",
  EAUsersProfileLinks,
  {styles},
);


