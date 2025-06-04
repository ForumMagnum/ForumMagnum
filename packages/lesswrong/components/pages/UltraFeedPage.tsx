import React from 'react';
import { useStyles, defineStyles } from '../hooks/useStyles';
import { useCurrentUser } from '../common/withUser';
import UltraFeed from "../ultraFeed/UltraFeed";

const styles = defineStyles("UltraFeedPage", (theme: ThemeType) => ({
  loginMessage: {
    textAlign: 'center',
    padding: 20,
  },
}));

const UltraFeedPage = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  if (!currentUser) {
    return (
      <div className={classes.loginMessage}>
        You must be logged in to use the feed.
      </div>
    );
  }

  return <UltraFeed alwaysShow />;
};

export default UltraFeedPage;

 
