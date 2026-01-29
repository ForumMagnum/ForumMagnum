import React from 'react';
import type { ChangeMetrics } from '../../server/collections/revisions/collection';
import classNames from 'classnames';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const styles = defineStyles("ChangeMetricsDisplay", (theme: ThemeType) => ({
  root: {
    fontFamily: theme.typography.fontFamily,
  },
  charsAdded: {
    color: theme.palette.text.charsAdded,
  },
  charsRemoved: {
    color: theme.palette.text.charsRemoved,
  },
}), {
  stylePriority: -1,
});

const ChangeMetricsDisplay = ({changeMetrics, showCharacters, className}: {
  changeMetrics: ChangeMetrics,
  showCharacters?: boolean,
  className?: string,
}) => {
  const {added, removed} = changeMetrics;
  const characters = showCharacters ? " characters" : "";
  const classes = useStyles(styles);

  return <span className={classNames(classes.root, className)}>
    {(added>0 && removed>0)
      && <>(<span className={classes.charsAdded}>+{added}</span>/<span className={classes.charsRemoved}>-{removed}</span>{characters})</>}
    {(added>0 && removed===0)
      && <span className={classes.charsAdded}>(+{added}{characters})</span>}
    {(added===0 && removed>0)
      && <span className={classes.charsRemoved}>(-{removed}{characters})</span>}
  </span>
}

export default ChangeMetricsDisplay;


