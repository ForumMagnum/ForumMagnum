import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useStyles, defineStyles } from '../hooks/useStyles';
import { SECTION_WIDTH } from '../common/SingleColumnSection';
import { useCurrentUser } from '../common/withUser';

const styles = defineStyles("UltraFeedPage", (theme: ThemeType) => ({
  root: {
    display: 'flex',
    justifyContent: 'center',
    maxWidth: SECTION_WIDTH,
    marginLeft: "auto",
    marginRight: "auto",
    position: "relative",
    zIndex: theme.zIndexes.singleColumnSection,
  },
}));

const UltraFeedPage = () => {
  const classes = useStyles(styles);
  const { UltraFeed } = Components;

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

const UltraFeedPageComponent = registerComponent('UltraFeedPage', UltraFeedPage);

export default UltraFeedPage;

declare global {
  interface ComponentTypes {
    UltraFeedPage: typeof UltraFeedPageComponent
  }
} 
