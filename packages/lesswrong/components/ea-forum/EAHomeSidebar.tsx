import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { useTracking } from "../../lib/analyticsEvents";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: 250,
    height: 250,
    backgroundColor: "red",
  }
});

export const EAHomeSidebar = ({classes}: {
  classes: ClassesType,
}) => {
  const { captureEvent } = useTracking(); //it is virtuous to add analytics tracking to new components
  return <div className={classes.root}>

  </div>;
}

const EAHomeSidebarComponent = registerComponent('EAHomeSidebar', EAHomeSidebar, {styles});

declare global {
  interface ComponentTypes {
    EAHomeSidebar: typeof EAHomeSidebarComponent
  }
}
