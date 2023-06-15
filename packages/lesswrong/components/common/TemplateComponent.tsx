import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const TemplateComponent = ({classes}: {
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  return <div className={classes.root}>

  </div>;
}

const TemplateComponentComponent = registerComponent('TemplateComponent', TemplateComponent, {styles});

declare global {
  interface ComponentTypes {
    TemplateComponent: typeof TemplateComponentComponent
  }
}

