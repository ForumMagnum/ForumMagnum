import React, { useCallback } from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { useUnreadNotifications } from "../hooks/useUnreadNotifications";
import { styles } from '../notifications/notificationsMenuButtonStyles';
import { Badge } from "@/components/widgets/Badge";
import IconButton from "@/lib/vendor/@material-ui/core/src/IconButton";
import classNames from "classnames";
import { useLocation, useNavigate } from "../../lib/routeUtil";
import LWTooltip from "../common/LWTooltip";
import ForumIcon from "../common/ForumIcon";
import { useReadQuery } from "@apollo/client/react";
import { useStyles } from "../hooks/useStyles";

const MessagesMenuButton = ({className}: {
  className?: string,
}) => {
  const classes = useStyles(styles);
  const {unreadNotificationCountsQueryRef} = useUnreadNotifications();
  const {data} = useReadQuery(unreadNotificationCountsQueryRef!);
  const unreadPrivateMessages = data?.unreadNotificationCounts.unreadPrivateMessages;
  
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

export default registerComponent(
  "MessagesMenuButton",
  MessagesMenuButton,
);


