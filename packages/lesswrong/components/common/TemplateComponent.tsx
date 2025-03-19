// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useTracking } from "../../lib/analyticsEvents";
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("TemplateComponent", (theme: ThemeType) => ({ 
  root: {
  }
}));

export const TemplateComponent = () => {
  const classes = useStyles(styles);
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  return <div className={classes.root}>

  </div>;
}

const TemplateComponentComponent = registerComponent('TemplateComponent', TemplateComponent);

declare global {
  interface ComponentTypes {
    TemplateComponent: typeof TemplateComponentComponent
  }
}
