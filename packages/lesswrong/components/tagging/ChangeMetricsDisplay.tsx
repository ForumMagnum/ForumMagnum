import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import type { ChangeMetrics } from '../../lib/collections/revisions/collection';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    fontFamily: theme.typography.fontFamily,
  },
  charsAdded: {
    color: theme.palette.text.charsAdded,
  },
  charsRemoved: {
    color: theme.palette.text.charsRemoved,
  },
});


const ChangeMetricsDisplay = ({changeMetrics, classes}: {
  changeMetrics: ChangeMetrics,
  classes: ClassesType
}) => {
  const {added, removed} = changeMetrics;
  
  return <span className={classes.root}>
    {(added>0 && removed>0)
      && <>(<span className={classes.charsAdded}>+{added}</span>/<span className={classes.charsRemoved}>-{removed}</span>)</>}
    {(added>0 && removed==0)
      && <span className={classes.charsAdded}>(+{added})</span>}
    {(added==0 && removed>0)
      && <span className={classes.charsRemoved}>(-{removed})</span>}
  </span>
}

const ChangeMetricsDisplayComponent = registerComponent("ChangeMetricsDisplay", ChangeMetricsDisplay, {styles});

declare global {
  interface ComponentTypes {
    ChangeMetricsDisplay: typeof ChangeMetricsDisplayComponent
  }
}
