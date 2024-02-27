import React from 'react';
import { Components, registerComponent } from "../../lib/vulcan-lib";

const styles = (theme: ThemeType): JssStyles => ({
})

const PreloadScaffoldPage = ({classes}: {
  classes: ClassesType,
}) => {
  return <div id="preload-scaffold-page" />
}

const PreloadScaffoldPageComponent = registerComponent('PreloadScaffoldPage', PreloadScaffoldPage, {styles});

declare global {
  interface ComponentTypes {
    PreloadScaffoldPage: typeof PreloadScaffoldPageComponent
  }
}

