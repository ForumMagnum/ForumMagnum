import React, { useEffect } from 'react';
import Badge from '@material-ui/core/Badge';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import IconButton from '@material-ui/core/IconButton';
import classNames from 'classnames';
import { isFriendlyUI } from '../../themes/forumTheme';

export const styles = (theme: ThemeType) => ({
  badgeContainer: {
    padding: "none",
    verticalAlign: "inherit",
    fontFamily: isFriendlyUI
      ? theme.palette.fonts.sansSerifStack
      : 'freight-sans-pro, sans-serif',
  },
  badge: {
    right: "1px",
    top: "1px",
    pointerEvents: "none",
    ...(isFriendlyUI
      ? {
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.22px",
        color: `${theme.palette.text.alwaysWhite} !important`,
        backgroundColor: theme.palette.primary.main,
        borderRadius: "50%",
      }
      : {
        backgroundColor: "inherit",
        fontWeight: 500,
        fontFamily: "freight-sans-pro, sans-serif",
        fontSize: 12,
        color: theme.palette.header.text,
      }),
  },
  buttonOpen: {
    backgroundColor: theme.palette.buttons.notificationsBellOpen.background,
    color: isFriendlyUI
      ? theme.palette.grey[600]
      : theme.palette.buttons.notificationsBellOpen.icon,
  },
  buttonClosed: {
    backgroundColor: "transparent",
    color: isFriendlyUI
      ? theme.palette.grey[600]
      : theme.palette.header.text,
  },
  buttonActive: {
    backgroundColor: theme.palette.greyAlpha(0.1),
  },
  tooltip: {
    background: `${theme.palette.panelBackground.tooltipBackground2} !important`,
    padding: "5px 13px",
    transform: "translateY(5px)",
  },
  karmaStar: {
    color: theme.palette.icon.headerKarma,
    transform: "rotate(-15deg)",
    position: "absolute",
    left: -6,
    top: -6,
    width: 16,
    height: 16,
  },
});

type NotificationsMenuButtonProps = {
  unreadNotifications: number,
  open: boolean,
  toggle: ()=>void,
  className?: string,
  classes: ClassesType<typeof styles>,
}

const BookNotificationsMenuButton = ({
  unreadNotifications,
  open,
  toggle,
  className,
  classes,
}: NotificationsMenuButtonProps) => {
  const {ForumIcon} = Components;
  const buttonClass = open ? classes.buttonOpen : classes.buttonClosed;
  return (
    <Badge
      classes={{ root: classNames(classes.badgeContainer, className), badge: classes.badge }}
      badgeContent={(unreadNotifications>0) ? `${unreadNotifications}` : ""}
    >
      <IconButton
        classes={{ root: buttonClass }}
        onClick={toggle}
      >
        {(unreadNotifications>0) ? <ForumIcon icon="Bell" /> : <ForumIcon icon="BellBorder" />}
      </IconButton>
    </Badge>
  );
}

const hasKarmaChange = (
  currentUser: UsersCurrent | null,
  karmaChanges?: UserKarmaChanges,
) => {
  if (!currentUser || !karmaChanges?.karmaChanges) {
    return false;
  }
  const {totalChange, updateFrequency, endDate} = karmaChanges.karmaChanges;
  if (!totalChange) {
    return false;
  }
  const lastOpened = currentUser.karmaChangeLastOpened ?? new Date(0);
  return lastOpened < endDate || updateFrequency === "realtime";
}

const FriendlyNotificationsMenuButton = ({
  unreadNotifications,
  toggle,
  className,
  classes,
}: NotificationsMenuButtonProps) => {
  const currentUser = useCurrentUser();
  const {pathname} = useLocation();
  const {document: karmaChanges, refetch} = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UserKarmaChanges",
    skip: !currentUser,
  });

  const showKarmaStar = hasKarmaChange(currentUser, karmaChanges);
  const hasBadge = unreadNotifications > 0 || showKarmaStar;
  const badgeText = hasBadge ? `${unreadNotifications}` : "";

  useEffect(() => {
    void refetch();
  }, [refetch, currentUser?.karmaChangeLastOpened]);

  const {LWTooltip, ForumIcon} = Components;
  return (
    <LWTooltip
      title="Notifications"
      placement="bottom"
      popperClassName={classes.tooltip}
    >
      <Badge
        classes={{
          root: classNames(classes.badgeContainer, className),
          badge: hasBadge ? classes.badge : undefined,
        }}
        badgeContent={
          <>
            {badgeText}
            {showKarmaStar &&
              <ForumIcon icon="Star" className={classes.karmaStar} />
            }
          </>
        }
      >
        <IconButton
          classes={{root: classNames(classes.buttonClosed, {
            [classes.buttonActive]: pathname.indexOf("/notifications") === 0,
          })}}
          onClick={toggle}
        >
          <ForumIcon icon="BellBorder" />
        </IconButton>
      </Badge>
    </LWTooltip>
  );
}

const NotificationsMenuButtonComponent = registerComponent(
  "NotificationsMenuButton",
  isFriendlyUI ? FriendlyNotificationsMenuButton : BookNotificationsMenuButton,
  {
    styles,
    stylePriority: -1,
    areEqual: "auto",
  },
);

declare global {
  interface ComponentTypes {
    NotificationsMenuButton: typeof NotificationsMenuButtonComponent
  }
}
