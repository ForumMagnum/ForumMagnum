import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles('CkEditorLoadError', (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    fontSize: 13,
    padding: 12,
    borderRadius: 4,
    backgroundColor: theme.palette.background.warningTranslucent,
    color: theme.palette.text.normal,
  },
  details: {
    marginTop: 4,
    fontSize: 11,
    color: theme.palette.text.dim,
  },
}));

/**
 * Shown in place of a CkEditor instance that failed to initialize (eg because
 * it couldn't get a CkEditor cloud services token), which would otherwise
 * just be silently missing.
 */
export const CkEditorLoadError = ({error}: {error: Error}) => {
  const classes = useStyles(styles);
  return <div className={classes.root}>
    The editor failed to load. Try reloading the page.
    <div className={classes.details}>{error.message}</div>
  </div>
}
