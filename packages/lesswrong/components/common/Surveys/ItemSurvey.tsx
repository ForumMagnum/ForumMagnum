// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../../lib/vulcan-lib';
import { useTracking } from "../../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ItemSurvey = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking();
  return <div className={classes.root}>

  </div>;
}

const ItemSurveyComponent = registerComponent('ItemSurvey', ItemSurvey, {styles});

declare global {
  interface ComponentTypes {
    ItemSurvey: typeof ItemSurveyComponent
  }
}
