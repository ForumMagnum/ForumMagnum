import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";
import { styles  } from "../notifications/NotificationsMenuButton";
import classNames from "classnames";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import LWTooltip from "@/components/common/LWTooltip";
import ForumIcon from "@/components/common/ForumIcon";
import { Badge, IconButton } from "@/components/mui-replacement";

const MessagesMenuButton = ({className, classes}: {
  className?: string,
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
  return (
    <LWTooltip
      title="Messages"
      placement="bottom"
      popperClassName={classes.tooltip}
      className={className}
    >
      <Badge
        classes={{
          root: classes.badgeContainer,
          badge: classNames(classes.badge, {
            [classes.badgeBackground]: hasBadge,
            [classes.badge1Char]: badgeText.length === 1,
            [classes.badge2Chars]: badgeText.length === 2,
          })
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

export default MessagesMenuButtonComponent;
