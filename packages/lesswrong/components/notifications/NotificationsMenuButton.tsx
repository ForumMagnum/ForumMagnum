import React, { useCallback, useEffect, useRef, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import { isFriendlyUI } from '../../themes/forumTheme';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
import { Badge } from "@/components/widgets/Badge";
import classNames from 'classnames';
import DeferRender from '../common/DeferRender';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import ForumIcon from "../common/ForumIcon";
import LWPopper from "../common/LWPopper";
import LWClickAwayListener from "../common/LWClickAwayListener";
import NotificationsPopover from "./NotificationsPopover";

/**
 * These same styles are also used by `MessagesMenuButton`, so changes here
 * should also be checked there as well.
 */
export const styles = (theme: ThemeType) => ({
  badgeContainer: {
    padding: "none",
    verticalAlign: "inherit",
    fontFamily: isFriendlyUI
      ? theme.palette.fonts.sansSerifStack
      : 'freight-sans-pro, sans-serif',
  },
  badge: {
    pointerEvents: "none",
    ...(isFriendlyUI
      ? {
        top: 3,
        right: 6,
        maxHeight: 20,
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.22px",
        color: `${theme.palette.text.alwaysWhite} !important`,
        borderRadius: "50%",
      }
      : {
        top: 1,
        right: 1,
        fontWeight: 500,
        fontFamily: "freight-sans-pro, sans-serif",
        fontSize: 12,
        color: theme.palette.header.text,
      }),
  },
  badgeBackground: {
    backgroundColor: isFriendlyUI
      ? theme.palette.primary.main
      : "inherit",
  },
  badge1Char: isFriendlyUI
    ? {
      width: 18,
      height: 18,
    }
    : {},
  badge2Chars: isFriendlyUI
    ? {
      width: 20,
      height: 20,
    }
    : {},
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
  karmaStar: {
    color: theme.palette.icon.headerKarma,
    transform: "rotate(-15deg)",
    position: "absolute",
    width: 16,
    height: 16,
  },
  karmaStarWithBadge: {
    left: -6,
    top: -6,
  },
  karmaStarWithoutBadge: {
    left: 1,
    top: 1,
  },
  tooltip: {
    background: `${theme.palette.panelBackground.tooltipBackground2} !important`,
    padding: "5px 13px",
    transform: "translateY(5px)",
  },
});

type NotificationsMenuButtonProps = {
  open: boolean,
  toggle: () => void,
  className?: string,
  classes: ClassesType<typeof styles>,
}

const BookNotificationsMenuButton = ({
  open,
  toggle,
  className,
  classes,
}: NotificationsMenuButtonProps) => {
  const {unreadNotifications} = useUnreadNotifications();
  const buttonClass = open ? classes.buttonOpen : classes.buttonClosed;
  return (
    <Badge
      className={classNames(classes.badgeContainer, className)}
      badgeClassName={classNames(classes.badge, classes.badgeBackground)}
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
  const {
    updateFrequency, endDate, posts, comments, tagRevisions,
  } = karmaChanges.karmaChanges;
  if (
    !(posts?.length || comments?.length || tagRevisions?.length) ||
    updateFrequency === "disabled"
  ) {
    return false;
  }
  const lastOpened = currentUser.karmaChangeLastOpened ?? new Date(0);
  return lastOpened < (endDate ?? new Date(0)) || updateFrequency === "realtime";
}

const FriendlyNotificationsMenuButton = ({
  toggle,
  className,
  classes,
}: NotificationsMenuButtonProps) => {
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const {pathname} = useLocation();
  const {unreadNotifications, notificationsOpened} = useUnreadNotifications();
  const [open, setOpen] = useState(false);
  const anchorEl = useRef<HTMLDivElement>(null);
  const {document: karmaChanges, refetch} = useSingle({
    documentId: currentUser?._id,
    collectionName: "Users",
    fragmentName: "UserKarmaChanges",
    skip: !currentUser,
  });

  const showKarmaStar = hasKarmaChange(currentUser, karmaChanges);
  const hasBadge = unreadNotifications > 0;
  const badgeText = hasBadge ? `${unreadNotifications}` : "";

  useEffect(() => {
    void refetch();
  }, [refetch, currentUser?.karmaChangeLastOpened]);

  const onOpenNotificationsPopover = useCallback(() => {
    const now = new Date();

    if (karmaChanges?.karmaChanges) {
      void updateCurrentUser({
        karmaChangeLastOpened: karmaChanges.karmaChanges.endDate,
        karmaChangeBatchStart: now,
      })
    }

    void notificationsOpened();
  }, [updateCurrentUser, notificationsOpened, karmaChanges?.karmaChanges]);

  const closePopover = useCallback(() => setOpen(false), []);

  const onClick = useCallback(() => {
    if (!open) {
      onOpenNotificationsPopover();
    }

    setOpen((open) => !open);
    toggle();
  }, [toggle, open, onOpenNotificationsPopover]);

  return (
    <div ref={anchorEl}>
      <Badge
        className={classNames(classes.badgeContainer, className)}
        badgeClassName={classNames(classes.badge, {
          [classes.badgeBackground]: hasBadge,
          [classes.badge1Char]: badgeText.length === 1,
          [classes.badge2Chars]: badgeText.length === 2,
        })}
        badgeContent={
          <>
            {badgeText}
            {showKarmaStar &&
              <ForumIcon
                icon="Star"
                className={classNames(classes.karmaStar, {
                  [classes.karmaStarWithBadge]: hasBadge,
                  [classes.karmaStarWithoutBadge]: !hasBadge,
                })}
              />
            }
          </>
        }
      >
        {/*
          * `LWClickAwayListener` is outside the `LWPopper` so that clicks on the notification bell
          * itself don't trigger the clickaway listener (which would result in the popper closing and
          * then reopening).
          *
          * Note that this violates a general rule in favour of putting the clickaway listener inside
          * `LWPopper` see this PR description for why that rule exists: https://github.com/ForumMagnum/ForumMagnum/pull/9331
          */}
        <LWClickAwayListener onClickAway={() => setOpen(false)}>
          <>
            <IconButton
              classes={{root: classNames(classes.buttonClosed, {
                [classes.buttonActive]: pathname.indexOf("/notifications") === 0,
              })}}
              onClick={onClick}
            >
              <ForumIcon icon="BellBorder" />
            </IconButton>
            <DeferRender ssr={false}>
              <LWPopper
                open={open}
                anchorEl={anchorEl.current}
                placement="bottom"
                tooltip={false}
                overflowPadding={16}
                clickable
              >
                <NotificationsPopover
                  karmaChanges={karmaChanges?.karmaChanges}
                  onOpenNotificationsPopover={onOpenNotificationsPopover}
                  closePopover={closePopover}
                />
              </LWPopper>
            </DeferRender>
          </>
        </LWClickAwayListener>
      </Badge>
    </div>
  );
}

export default registerComponent(
  "NotificationsMenuButton",
  isFriendlyUI ? FriendlyNotificationsMenuButton : BookNotificationsMenuButton,
  {
    styles,
    stylePriority: -1,
    areEqual: "auto",
  },
);


