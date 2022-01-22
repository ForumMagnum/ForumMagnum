import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const TemplateComponent = ({classes}: {
  classes: ClassesType,
}) => {
  return <div className={classes.root}>

  </div>;
}

const TemplateComponentComponent = registerComponent('TemplateComponent', TemplateComponent, {styles});

declare global {
  interface ComponentTypes {
    TemplateComponent: typeof TemplateComponentComponent
  }
}

