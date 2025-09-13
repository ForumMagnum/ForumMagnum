"use client";

import React, { useEffect } from 'react';
import { useStyles, defineStyles } from '../hooks/useStyles';
import { useCurrentUser } from '../common/withUser';
import UltraFeed from "../ultraFeed/UltraFeed";
import { useCookiesWithConsent } from '../hooks/useCookiesWithConsent';
import { ULTRA_FEED_ENABLED_COOKIE, ULTRA_FEED_PAGE_VISITED_COOKIE } from '../../lib/cookies/cookies';

const styles = defineStyles("UltraFeedPage", (theme: ThemeType) => ({
  loginMessage: {
    textAlign: 'center',
    padding: 20,
  },
}));

const UltraFeedPage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const [cookies, setCookie] = useCookiesWithConsent([ULTRA_FEED_PAGE_VISITED_COOKIE]);

  const isFirstVisit = cookies[ULTRA_FEED_PAGE_VISITED_COOKIE] !== 'true';

  useEffect(() => {
    if (isFirstVisit) {
      setCookie(ULTRA_FEED_ENABLED_COOKIE, 'true', { 
        path: "/", 
      });
    }

    setCookie(ULTRA_FEED_PAGE_VISITED_COOKIE, 'true', { 
      path: "/", 
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCookie]);

  if (!currentUser) {
    return (
      <div className={classes.loginMessage}>
        You must be logged in to use the feed.
      </div>
    );
  }

  return <UltraFeed alwaysShow hideTitle />;
};

export default UltraFeedPage;

 
