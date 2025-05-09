import React, { useCallback } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";
import { styles  } from "../notifications/NotificationsMenuButton";
import { Badge } from "@/components/widgets/Badge";
import IconButton from "@/lib/vendor/@material-ui/core/src/IconButton";
import classNames from "classnames";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import { LWTooltip } from "../common/LWTooltip";
import { ForumIcon } from "../common/ForumIcon";

const MessagesMenuButtonInner = ({className, classes}: {
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
        className={classes.badgeContainer}
        badgeClassName={classNames(classes.badge, {
          [classes.badgeBackground]: hasBadge,
          [classes.badge1Char]: badgeText.length === 1,
          [classes.badge2Chars]: badgeText.length === 2,
        })}
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

export const MessagesMenuButton = registerComponent(
  "MessagesMenuButton",
  MessagesMenuButtonInner,
  {styles},
);


