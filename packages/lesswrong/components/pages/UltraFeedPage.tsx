import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useStyles, defineStyles } from '../hooks/useStyles';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { useCurrentUser } from '../common/withUser';
import { UltraFeed } from "../ultraFeed/UltraFeed";

const styles = defineStyles("UltraFeedPage", (theme: ThemeType) => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    width: SECTION_WIDTH,
    marginLeft: "auto",
    marginRight: "auto",
    position: "relative",
    zIndex: theme.zIndexes.singleColumnSection,
  },
}));

const UltraFeedPageInner = () => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();

  if (!currentUser) {
    return (
      <div className={classes.root}>
        You must be logged in to use the feed.
      </div>
    );
  }

  return (
    <div className={classes.root}>
      <UltraFeed alwaysShow={true} />
    </div>
  );
};

export const UltraFeedPage = registerComponent('UltraFeedPage', UltraFeedPageInner);

export default UltraFeedPageInner;

 
