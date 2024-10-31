// TODO: Import component in components.ts
import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType) => ({
  root: {

  }
});

export const ThinkPagePostRead = ({classes}: {
  classes: ClassesType<typeof styles>,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  return <div className={classes.root}>

  </div>;
}

const ThinkPagePostReadComponent = registerComponent('ThinkPagePostRead', ThinkPagePostRead, {styles});

declare global {
  interface ComponentTypes {
    ThinkPagePostRead: typeof ThinkPagePostReadComponent
  }
}
