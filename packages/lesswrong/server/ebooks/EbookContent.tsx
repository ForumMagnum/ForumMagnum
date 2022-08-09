import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const EbookContent = ({classes, children}: {
  classes: ClassesType,
  children: any
}) => {
  return <div className={classes.root}>
    <h1>Title Example</h1>
    <p>Example text, here we go!</p>
  </div>;
}

const EbookContentComponent = registerComponent('EbookContent', EbookContent, {styles});

declare global {
  interface ComponentTypes {
    EbookContent: typeof EbookContentComponent
  }
}

