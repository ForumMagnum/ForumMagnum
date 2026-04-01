"use client";

import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { useNavigate, useSubscribedLocation } from '@/lib/routeUtil';
import { useCurrentUser } from '../common/withUser';
import ErrorAccessDenied from '../common/ErrorAccessDenied';
import SingleColumnSection from '../common/SingleColumnSection';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import NotificationsPageList from './NotificationsPageList';
import { Card } from '../widgets/Paper';

type NotificationTab = 'all' | 'posts' | 'comments' | 'messages';

const notificationTabTerms: Record<NotificationTab, Omit<NotificationsViewTerms, 'userId'>> = {
  all: { view: 'userNotifications' },
  posts: { view: 'userNotifications', type: 'newPost' },
  comments: { view: 'userNotifications', type: 'newComment' },
  messages: { view: 'userNotifications', type: 'newMessage' },
};

const tabLabels: Record<NotificationTab, string> = {
  all: 'All',
  posts: 'Posts',
  comments: 'Comments',
  messages: 'Messages',
};

const hashToTab = (hash: string): NotificationTab => {
  switch (hash) {
    case '#posts':
      return 'posts';
    case '#comments':
      return 'comments';
    case '#messages':
      return 'messages';
    default:
      return 'all';
  }
};

const styles = defineStyles('NotificationsPage', (theme: ThemeType) => ({
  root: {
    marginBottom: 80,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 24,
    [theme.breakpoints.down('xs')]: {
      paddingTop: 20,
      paddingBottom: 16,
    },
  },
  title: {
    margin: 0,
    fontSize: 28,
    lineHeight: 1.2,
    fontWeight: 600,
    fontFamily: theme.typography.headerStyle?.fontFamily,
    color: theme.palette.text.normal,
    letterSpacing: '-0.01em',
    [theme.breakpoints.down('xs')]: {
      fontSize: 24,
    },
  },
  panel: {
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.normal,
    borderRadius: theme.borderRadius.default,
    overflow: 'hidden',
    boxShadow: 'none',
  },
  tabs: {
    borderBottom: theme.palette.border.normal,
    display: 'flex',
    gap: 0,
    padding: '0 8px',
    [theme.breakpoints.down('xs')]: {
      padding: '0 4px',
    },
  },
  tab: {
    ...theme.typography.body2,
    appearance: 'none',
    background: 'transparent',
    border: 0,
    borderBottom: '2px solid transparent',
    color: theme.palette.text.dim55,
    cursor: 'pointer',
    minWidth: 0,
    padding: '12px 16px',
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.2,
    transition: 'color 120ms ease, border-color 120ms ease',
    '&:hover': {
      color: theme.palette.text.normal,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.palette.greyAlpha(0.35)}`,
      outlineOffset: -2,
    },
    [theme.breakpoints.down('xs')]: {
      fontSize: 13,
      padding: '10px 12px',
    },
  },
  tabActive: {
    color: theme.palette.text.normal,
    borderBottomColor: theme.palette.text.normal,
  },
  listWrapper: {
    minHeight: 120,
  },
}));

const NotificationsPage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const navigate = useNavigate();
  const { location: { hash } } = useSubscribedLocation();
  const { notificationsOpened } = useUnreadNotifications();
  const [activeTab, setActiveTab] = useState<NotificationTab>(() => hashToTab(hash));
  const markedReadForUserRef = useRef<string | null>(null);

  useEffect(() => {
    setActiveTab(hashToTab(hash));
  }, [hash]);

  useEffect(() => {
    if (!currentUser?._id || markedReadForUserRef.current === currentUser._id) {
      return;
    }

    markedReadForUserRef.current = currentUser._id;
    void notificationsOpened();
  }, [currentUser?._id, notificationsOpened]);

  if (!currentUser) {
    return <ErrorAccessDenied />;
  }

  const handleChangeTab = (value: NotificationTab) => {
    setActiveTab(value);
    navigate({ hash: value === 'all' ? '' : `#${value}` }, { replace: true, scroll: false });
  };

  return (
    <SingleColumnSection className={classes.root}>
      <div className={classes.header}>
        <h1 className={classes.title}>
          Notifications
        </h1>
      </div>

      <Card className={classes.panel}>
        <div className={classes.tabs} role="tablist" aria-label="Notification categories">
          {(['all', 'posts', 'comments', 'messages'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              className={classNames(classes.tab, {
                [classes.tabActive]: activeTab === tab,
              })}
              onClick={() => handleChangeTab(tab)}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        <div className={classes.listWrapper}>
          <NotificationsPageList
            terms={{
              ...notificationTabTerms[activeTab],
              userId: currentUser._id,
            }}
          />
        </div>
      </Card>
    </SingleColumnSection>
  );
};

export default NotificationsPage;
