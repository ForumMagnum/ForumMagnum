import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useNavigate } from "../../lib/reactRouterWrapper";
import { useLocation } from "../../lib/routeUtil";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";
import { styles } from "../notifications/NotificationsMenuButton";
import Badge from "@material-ui/core/Badge";
import IconButton from "@material-ui/core/IconButton";
import classNames from "classnames";

const MessagesMenuButton = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const {unreadPrivateMessages} = useUnreadNotifications();
  const {pathname} = useLocation();
  const navigate = useNavigate();
  const onClick = useCallback(() => {
    navigate("/inbox");
  }, [navigate]);
  const hasBadge = unreadPrivateMessages > 0;
  const badgeText = hasBadge ? String(unreadPrivateMessages) : "";
  const {LWTooltip, ForumIcon} = Components;
  return (
    <LWTooltip
      title="Messages"
      placement="bottom"
      popperClassName={classes.tooltip}
    >
      <Badge
        classes={{
          root: classes.badgeContainer,
          badge: hasBadge ? classes.badge : undefined,
        }}
        badgeContent={badgeText}
      >
        <IconButton
          classes={{root: classNames(classes.buttonClosed, {
            [classes.buttonActive]: pathname.indexOf("/inbox") === 0,
          })}}
          onClick={onClick}
        >
          <ForumIcon icon="Envelope" />
        </IconButton>
      </Badge>
    </LWTooltip>
  );
}

const MessagesMenuButtonComponent = registerComponent(
  "MessagesMenuButton",
  MessagesMenuButton,
  {styles},
);

declare global {
  interface ComponentTypes {
    MessagesMenuButton: typeof MessagesMenuButtonComponent
  }
}
