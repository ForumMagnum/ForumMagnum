// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";
import { useMulti } from '@/lib/crud/withMulti';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ReviewWinnerItem = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components

  const {results: currentSpotlightResults} = useMulti({
    collectionName: "ReviewWinners",
    fragmentName: "ReviewWinnerTopPostsPage",
    terms: {
      view: "mostRecentlyPromotedSpotlights",
      limit: 1,
    },
  });
  return currentSpotlightResults?.[0];

  return <div className={classes.root}>

  </div>;
}

const ReviewWinnerItemComponent = registerComponent('ReviewWinnerItem', ReviewWinnerItem, {styles});

declare global {
  interface ComponentTypes {
    ReviewWinnerItem: typeof ReviewWinnerItemComponent
  }
}
