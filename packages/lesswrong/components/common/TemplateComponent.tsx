// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const TemplateComponent = ({classes}: {
  classes: ClassesType<typeof styles>,
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
