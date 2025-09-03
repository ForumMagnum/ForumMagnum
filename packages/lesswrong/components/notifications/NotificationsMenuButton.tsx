import React, { useCallback, useEffect, useRef, useState } from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useCurrentUser } from '../common/withUser';
import { useLocation } from '../../lib/routeUtil';
import { isFriendlyUI } from '../../themes/forumTheme';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import IconButton from '@/lib/vendor/@material-ui/core/src/IconButton';
import { Badge } from "@/components/widgets/Badge";
import classNames from 'classnames';
import DeferRender from '../common/DeferRender';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import ForumIcon from "../common/ForumIcon";
import LWPopper from "../common/LWPopper";
import LWClickAwayListener from "../common/LWClickAwayListener";
import NotificationsPopover from "./NotificationsPopover";
import { useReadQuery } from '@apollo/client/react';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { SuspenseWrapper } from '../common/SuspenseWrapper';
import ErrorBoundary from '../common/ErrorBoundary';

const UserKarmaChangesQuery = gql(`
  query NotificationsMenuButton($documentId: String) {
    user(input: { selector: { documentId: $documentId } }) {
      result {
        ...UserKarmaChanges
      }
    }
  }
`);

/**
 * These same styles are also used by `MessagesMenuButton`, so changes here
 * should also be checked there as well.
 */
export const styles = defineStyles("NotificationsMenuButton", (theme: ThemeType) => ({
  badgeContainer: {
    padding: "none",
    verticalAlign: "inherit",
    fontFamily: theme.isFriendlyUI
      ? theme.palette.fonts.sansSerifStack
      : 'freight-sans-pro, sans-serif',
  },
  badge: {
    pointerEvents: "none",
    ...(theme.isFriendlyUI
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
    backgroundColor: theme.isFriendlyUI
      ? theme.palette.primary.main
      : "inherit",
  },
  badge1Char: theme.isFriendlyUI
    ? {
      width: 18,
      height: 18,
    }
    : {},
  badge2Chars: theme.isFriendlyUI
    ? {
      width: 20,
      height: 20,
    }
    : {},
  buttonOpen: {
    backgroundColor: theme.palette.buttons.notificationsBellOpen.background,
    color: theme.isFriendlyUI
      ? theme.palette.grey[600]
      : theme.palette.buttons.notificationsBellOpen.icon,
  },
  buttonClosed: {
    backgroundColor: "transparent",
    color: theme.isFriendlyUI
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
}), {stylePriority: -1});

type NotificationsMenuButtonProps = {
  open: boolean,
  toggle: () => void,
  className?: string,
}

const BookNotificationsMenuButtonInner = ({
  open,
  toggle,
  className,
}: NotificationsMenuButtonProps) => {
  const classes = useStyles(styles);
  const {unreadNotificationCountsQueryRef} = useUnreadNotifications();
  const {data} = useReadQuery(unreadNotificationCountsQueryRef!);
  const {unreadNotifications} = data?.unreadNotificationCounts ?? 0;
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

const BookNotificationsMenuButtonPlaceholder = ({toggle}: {
  toggle: () => void,
}) => {
  const classes = useStyles(styles);
  return <IconButton classes={{ root: classes.buttonClosed }} onClick={toggle}>
    <ForumIcon icon="BellBorder"/>
  </IconButton>
}

const hasKarmaChange = (
  currentUser: UsersCurrent | null,
  karmaChanges?: UserKarmaChanges | null,
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

const FriendlyNotificationsMenuButtonInner = ({
  toggle,
  className,
}: NotificationsMenuButtonProps) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const {pathname} = useLocation();
  const {unreadNotificationCountsQueryRef, notificationsOpened} = useUnreadNotifications();
  const {data} = useReadQuery(unreadNotificationCountsQueryRef!);
  const {unreadNotifications} = data?.unreadNotificationCounts ?? 0;
  const [open, setOpen] = useState(false);
  const anchorEl = useRef<HTMLDivElement>(null);
  const { refetch, data: karmaChangesData } = useQuery(UserKarmaChangesQuery, {
    variables: { documentId: currentUser?._id },
    skip: !currentUser,
  });
  const karmaChanges = karmaChangesData?.user?.result;

  const showKarmaStar = hasKarmaChange(currentUser, karmaChanges);
  const hasBadge = unreadNotifications > 0;
  const badgeText = hasBadge ? `${unreadNotifications}` : "";

  useEffect(() => {
    void refetch();
  }, [refetch, currentUser?.karmaChangeLastOpened]);

  const onOpenNotificationsPopover = useCallback(() => {
    const now = new Date();
    void updateCurrentUser({
      karmaChangeLastOpened: now,
      karmaChangeBatchStart: now,
    });
    void notificationsOpened();
  }, [updateCurrentUser, notificationsOpened]);

  const closePopover = useCallback(() => setOpen(false), []);

  const onClick = useCallback(() => {
    setOpen((open) => !open);
    toggle();
  }, [toggle]);
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

const FriendlyNotificationsMenuButtonPlaceholder = ({toggle}: {
  toggle: () => void,
}) => {
  // ea-forum-look-here
  // This component is a loading-placeholder that will be shown briefly (less
  // than a second) during pageload. It should visually match
  // FriendlyNotificationsMenuButtonInner (but with zero notifications). Not
  // implementing this will cause mild visual jank during loading (the buttons
  // will be hidden, causing things next to them to shift horizontally.)
  return null; // TODO
}

const NotificationsMenuButton = ({ open, toggle, className }: NotificationsMenuButtonProps) => {
  const fallback = isFriendlyUI
    ? <FriendlyNotificationsMenuButtonPlaceholder toggle={toggle} />
    : <BookNotificationsMenuButtonPlaceholder toggle={toggle} />
  return <SuspenseWrapper
    name="NotificationsMenuButton"
    fallback={fallback}
  >
    <ErrorBoundary fallback={fallback}>
      {isFriendlyUI
        ? <FriendlyNotificationsMenuButtonInner open={open} toggle={toggle} className={className}/>
        : <BookNotificationsMenuButtonInner open={open} toggle={toggle} className={className}/>
      }
    </ErrorBoundary>
  </SuspenseWrapper>
}

export default registerComponent("NotificationsMenuButton", NotificationsMenuButton, {
  areEqual: "auto",
});


