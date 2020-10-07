import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import { ChangeMetrics } from '../../lib/collections/revisions/collection';

const styles = (theme: ThemeType): JssStyles => ({
  charsAdded: {
    color: "#008800",
  },
  charsRemoved: {
    color: "#880000",
  },
});


const ChangeMetricsDisplay = ({changeMetrics, classes}: {
  changeMetrics: ChangeMetrics,
  classes: ClassesType
}) => {
  const {added, removed} = changeMetrics;
  
  return <span>
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
