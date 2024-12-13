// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ReviewProgressNominations = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  return <div className={classes.root}>

  </div>;
}

const ReviewProgressNominationsComponent = registerComponent('ReviewProgressNominations', ReviewProgressNominations, {styles});

declare global {
  interface ComponentTypes {
    ReviewProgressNominations: typeof ReviewProgressNominationsComponent
  }
}
