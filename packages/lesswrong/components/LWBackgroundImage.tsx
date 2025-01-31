// TODO: Import component in components.ts
import React from 'react';
import { registerComponent } from '../lib/vulcan-lib';

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const LWBackgroundImage = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  return <div className={classes.root}>

  </div>;
}

const LWBackgroundImageComponent = registerComponent('LWBackgroundImage', LWBackgroundImage, {styles});

declare global {
  interface ComponentTypes {
    LWBackgroundImage: typeof LWBackgroundImageComponent
  }
}
