import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import type { ChangeMetrics } from '../../server/collections/revisions/collection';
import classNames from 'classnames';

const styles = (theme: ThemeType) => ({
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

const ChangeMetricsDisplay = ({changeMetrics, showCharacters, className, classes}: {
  changeMetrics: ChangeMetrics,
  showCharacters?: boolean,
  className?: string,
  classes: ClassesType<typeof styles>,
}) => {
  const {added, removed} = changeMetrics;
  const characters = showCharacters ? " characters" : "";

  return <span className={classNames(classes.root, className)}>
    {(added>0 && removed>0)
      && <>(<span className={classes.charsAdded}>+{added}</span>/<span className={classes.charsRemoved}>-{removed}</span>{characters})</>}
    {(added>0 && removed===0)
      && <span className={classes.charsAdded}>(+{added}{characters})</span>}
    {(added===0 && removed>0)
      && <span className={classes.charsRemoved}>(-{removed}{characters})</span>}
  </span>
}

export default registerComponent(
  "ChangeMetricsDisplay",
  ChangeMetricsDisplay,
  {styles, stylePriority: -1},
);


