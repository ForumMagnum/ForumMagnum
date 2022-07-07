import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  root: {

  }
});

export const CuratedSequences = ({classes}: {
  classes: ClassesType,
}) => {
  return <div className={classes.root}>

  </div>;
}

const CuratedSequencesComponent = registerComponent('CuratedSequences', CuratedSequences, {styles});

declare global {
  interface ComponentTypes {
    CuratedSequences: typeof CuratedSequencesComponent
  }
}

