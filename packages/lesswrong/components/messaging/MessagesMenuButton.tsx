import React, { useCallback } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useNavigate } from "../../lib/reactRouterWrapper";
import { styles } from "../notifications/NotificationsMenuButton";
import Badge from "@material-ui/core/Badge";
import IconButton from "@material-ui/core/IconButton";

const MessagesMenuButton = ({unreadPrivateMessages, classes}: {
  unreadPrivateMessages: number,
  classes: ClassesType<typeof styles>,
}) => {
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
          classes={{root: classes.buttonClosed}}
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
