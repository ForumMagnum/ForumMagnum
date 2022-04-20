import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import React, { useState } from 'react';
import SwipeableDrawer from '@material-ui/core/SwipeableDrawer';
import Badge from '@material-ui/core/Badge';
import Tab from '@material-ui/core/Tab';
import Tabs from '@material-ui/core/Tabs';
import AllIcon from '@material-ui/icons/Notifications';
import ClearIcon from '@material-ui/icons/Clear';
import PostsIcon from '@material-ui/icons/Description';
import CommentsIcon from '@material-ui/icons/ModeComment';
import MailIcon from '@material-ui/icons/Mail';
import { useCurrentUser } from '../common/withUser';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import grey from '@material-ui/core/colors/grey';
import * as _ from 'underscore';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "inline-block",
    verticalAlign: "top",
  },
  drawerPaper: {
    width: 270,
    boxShadow: "rgba(0, 0, 0, 0.16) 0px 3px 10px, rgba(0, 0, 0, 0.23) 0px 3px 10px",
    zIndex: theme.zIndexes.notificationsMenu,
  },
  badgeContainer: {
    padding: "none",
    verticalAlign: "inherit",
  },
  badge: {
    backgroundColor: 'inherit',
    color: 'rgba(0,0,0,0.6)',
    fontSize: "12px",
    fontWeight: 500,
    right: "-15px",
    top: 0,
    pointerEvents: "none",
  },
  icon: {
    color: "rgba(0,0,0,0.8)",
  },
  hideButton: {
    position: "absolute",
    top: 0,
    right: 5,
  },
  cancel: {
    color: "rgba(0,0,0,0.3)",
    margin: "10px",
    cursor: "pointer",
  },
  tabBar: {
    background: grey[100],
  },
  tabLabel: {
    color: "rgba(0,0,0,0.8)",
    minWidth: "auto",
  },
  hiddenTab: {
    pointerEvents: "none",
    minWidth: "auto",
    width: 24,
  },
});

const NotificationsMenu = ({ classes, open, setIsOpen, hasOpened }: {
  classes: ClassesType,
  open: boolean,
  setIsOpen: (isOpen: boolean) => void,
  hasOpened: boolean,
}) => {
  const currentUser = useCurrentUser();
  const [tab,setTab] = useState(0);
  const { results } = useMulti({
    terms: {
      view: 'userNotifications',
      userId: currentUser ? currentUser._id : "",
      type: "newMessage"
    },
    collectionName: "Notifications",
    fragmentName: 'NotificationsList',
    pollInterval: 0,
    limit: 20,
    enableTotal: false,
  });

  const lastNotificationsCheck = currentUser?.lastNotificationsCheck ?? "";
  const newMessages = results && _.filter(results, (x) => x.createdAt > lastNotificationsCheck);
  if (!currentUser) {
    return null;
  }
  const notificationCategoryTabs: Array<{ name: string, icon: ()=>React.ReactNode, terms: NotificationsViewTerms }> = [
    {
      name: "All Notifications",
      icon: () => (<AllIcon classes={{root: classes.icon}}/>),
      terms: {view: "userNotifications"},
    },
    {
      name: "New Posts",
      icon: () => (<PostsIcon classes={{root: classes.icon}}/>),
      terms: {view: 'userNotifications', type: "newPost"},
    },
    {
      name: "New Comments",
      icon: () => (<CommentsIcon classes={{root: classes.icon}}/>),
      terms: {view: 'userNotifications', type: "newComment"},
    },
    {
      name: "New Messages",
      icon: () => (
        <Badge
          classes={{ root: classes.badgeContainer, badge: classes.badge }}
          badgeContent={(newMessages && newMessages.length) || ""}
        >
          <MailIcon classes={{root: classes.icon}} />
        </Badge>
      ),
      terms: {view: 'userNotifications', type: "newMessage"},
    }
  ];
  const category = notificationCategoryTabs[tab];
  const notificationTerms = category.terms;

  return (
    <div className={classes.root}>
      <Components.ErrorBoundary>
        {open && <SwipeableDrawer
          open={open}
          anchor="right"
          onClose={() => setIsOpen(false)}
          onOpen={() => setIsOpen(true)}
          classes={{
            paper: classes.drawerPaper,
          }}
          variant="persistent"
        >
          { hasOpened && <div className="notifications-menu-content">
            <Tabs
              fullWidth={true}
              value={tab}
              className={classes.tabBar}
              onChange={(event, tabIndex) => {
                setTab(tabIndex);
              }}
            >
              {notificationCategoryTabs.map(notificationCategory =>
                <Tab
                  icon={
                    <span title={notificationCategory.name}>
                      {notificationCategory.icon()}
                    </span>
                  }
                  key={notificationCategory.name}
                  className={classes.tabLabel}
                />
              )}
              
              {/* Include an extra, hidden tab to reserve space for the
                  close/X button (which hovers over the tabs). */}
              <Tab className={classes.hiddenTab} />
            </Tabs>
            <ClearIcon className={classNames(classes.hideButton, classes.cancel)} onClick={() => setIsOpen(false)} />
            <Components.NotificationsList terms={{...notificationTerms, userId: currentUser._id}} currentUser={currentUser}/>
          </div>}
        </SwipeableDrawer>}
      </Components.ErrorBoundary>
    </div>
  )
};

const NotificationsMenuComponent = registerComponent('NotificationsMenu', NotificationsMenu, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    NotificationsMenu: typeof NotificationsMenuComponent
  }
}

