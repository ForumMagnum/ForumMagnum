import React, { useCallback, useState } from 'react';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import { Badge } from "@/components/widgets/Badge";
import Tab from '@/lib/vendor/@material-ui/core/src/Tab';
import Tabs from '@/lib/vendor/@material-ui/core/src/Tabs';
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear';
import PostsIcon from '@/lib/vendor/@material-ui/icons/src/Description';
import CommentsIcon from '@/lib/vendor/@material-ui/icons/src/ModeComment';
import MailIcon from '@/lib/vendor/@material-ui/icons/src/Mail';
import { useCurrentUserId } from '../common/withUser';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { Drawer } from '@/components/material-ui/Drawer'
import ForumIcon from "../common/ForumIcon";
import ErrorBoundary from "../common/ErrorBoundary";
import LWTooltip from "../common/LWTooltip";
import NotificationsList from "./NotificationsList";
import { useReadQuery } from '@/lib/crud/useQuery';
import { SuspenseWrapper } from '../common/SuspenseWrapper';
import { registerComponent } from '@/lib/vulcan-lib/components';
import { Link } from '@/lib/reactRouterWrapper';

const styles = defineStyles("NotificationsMenu", (theme: ThemeType) => ({
  root: {
    display: "inline-block",
    verticalAlign: "top",
  },
  drawerPaper: {
    width: 270,
    boxShadow: theme.palette.boxShadow.notificationsDrawer,
    zIndex: theme.zIndexes.notificationsMenu,
  },
  badgeContainer: {
    padding: "none",
    verticalAlign: "inherit",
  },
  badge: {
    backgroundColor: 'inherit',
    color: theme.palette.text.notificationCount,
    fontSize: "12px",
    fontWeight: 500,
    right: "-15px",
    top: 0,
    pointerEvents: "none",
  },
  icon: {
    color: theme.palette.icon.slightlyDim,
    "$tabLabel:hover &": {
      color: theme.palette.greyAlpha(1.0),
    },
  },
  headerButtons: {
    position: "absolute",
    top: 0,
    right: 0,
    display: "flex",
  },
  settingsLink: {
    display: "block",
    height: 48,
    padding: "12px 6px",
    color: theme.palette.icon.dim5,
    "&:hover": {
      color: theme.palette.icon.normal,
    },
  },
  settingsIcon: {
    "--icon-size": "20px",
  },
  // Covers the header's bell icon, so that clicking the bell a second time
  // closes the drawer rather than hitting something else
  cancelWrapper: {
    height: 48,
    paddingLeft: 8,
    paddingRight: 5,
    cursor: "pointer",
  },
  cancel: {
    margin: "10px",

    color: theme.palette.icon.dim5,
    "$cancelWrapper:hover &": {
      color: theme.palette.icon.normal,
    },
  },
  tabBar: {
    background: theme.palette.panelBackground.notificationMenuTabBar,
  },
  tabLabel: {
    color: theme.palette.text.slightlyDim,
    minWidth: "auto",
  },
  hiddenTab: {
    pointerEvents: "none",
    minWidth: "auto",
    width: 68,
  },
}));

const NotificationsMenuInner = ({open, setIsOpen, hasOpened}: {
  open: boolean,
  setIsOpen: (isOpen: boolean) => void,
  hasOpened: boolean,
}) => {
  const classes = useStyles(styles);
  const currentUserId = useCurrentUserId();
  const [tab,setTab] = useState(0);
  const onClose = useCallback(() => setIsOpen(false), [setIsOpen]);

  if (!currentUserId) {
    return null;
  }
  const notificationCategoryTabs: Array<{ name: string, icon: () => React.ReactNode, terms: NotificationsViewTerms }> = [
    {
      name: "All Notifications",
      icon: () => (<ForumIcon icon="Bell" className={classes.icon}/>),
      terms: {view: "userNotifications"},
    },
    {
      name: "New Posts",
      icon: () => (<PostsIcon className={classes.icon}/>),
      terms: {view: 'userNotifications', type: "newPost"},
    },
    {
      name: "New Comments",
      icon: () => (<CommentsIcon className={classes.icon}/>),
      terms: {view: 'userNotifications', type: "newComment"},
    },
    {
      name: "New Messages",
      icon: () => (
        <Badge
          className={classes.badgeContainer}
          badgeClassName={classes.badge}
          badgeContent={<SuspenseWrapper name="UnreadPrivateMessagesCountBadge">
            <ErrorBoundary hideMessage>
              <UnreadPrivateMessagesCountBadge/>
            </ErrorBoundary>
          </SuspenseWrapper>}
        >
          <MailIcon className={classes.icon} />
        </Badge>
      ),
      terms: {view: 'userNotifications', type: "newMessage"},
    }
  ];
  const category = notificationCategoryTabs[tab];
  const notificationTerms = category.terms;

  return (
    <div className={classes.root}>
      <ErrorBoundary>
        {open && <Drawer
          open={open}
          anchor="right"
          onClose={onClose}
          paperClassName={classes.drawerPaper}
          variant="persistent"
        >
          { hasOpened && <div className="notifications-menu-content">
            <Tabs
              fullWidth={true}
              value={tab}
              className={classes.tabBar}
              onChange={(event, tabIndex) => {
                if (tabIndex >= notificationCategoryTabs.length) {
                  setIsOpen(false);
                } else {
                  setTab(tabIndex);
                }
              }}
            >
              {notificationCategoryTabs.map(notificationCategory =>
                <Tab
                  icon={
                    <LWTooltip title={notificationCategory.name} placement="bottom">
                      {notificationCategory.icon()}
                    </LWTooltip>
                  }
                  key={notificationCategory.name}
                  className={classes.tabLabel}
                />
              )}
              
              {/* Include an extra, hidden tab to reserve space for the settings
                * and close/X buttons (which hover over the tabs). Selecting this "tab"
                * (with a keyboard shortcut) closes the drawer (with a special
                * case in onChange).
                */}
              <Tab className={classes.hiddenTab} />
            </Tabs>
            <div className={classes.headerButtons}>
              <LWTooltip title="Notification settings" placement="bottom">
                <Link to="/account?tab=settings-notifications" onClick={onClose} className={classes.settingsLink}>
                  <ForumIcon icon="Settings" className={classes.settingsIcon}/>
                </Link>
              </LWTooltip>
              <div className={classes.cancelWrapper} onClick={() => setIsOpen(false)}>
                <ClearIcon className={classes.cancel} />
              </div>
            </div>
            <NotificationsList terms={{...notificationTerms, userId: currentUserId}} closeMenu={onClose}/>
          </div>}
        </Drawer>}
      </ErrorBoundary>
    </div>
  )
};

const UnreadPrivateMessagesCountBadge = () => {
  const {unreadNotificationCountsQueryRef} = useUnreadNotifications();
  const {data} = useReadQuery(unreadNotificationCountsQueryRef!);
  const unreadPrivateMessages = data?.unreadNotificationCounts?.unreadPrivateMessages ?? 0;
  return unreadPrivateMessages>0 ? `${unreadPrivateMessages}` : ""
}

const NotificationsMenu = ({open, setIsOpen, hasOpened}: {
  open: boolean,
  setIsOpen: (isOpen: boolean) => void,
  hasOpened: boolean,
}) => {
  return <SuspenseWrapper name="NotificationsMenu">
    <ErrorBoundary>
      <NotificationsMenuInner open={open} setIsOpen={setIsOpen} hasOpened={hasOpened}/>
    </ErrorBoundary>
  </SuspenseWrapper>
}

export default registerComponent("NotificationsMenu", NotificationsMenu, {
  areEqual: "auto"
});



