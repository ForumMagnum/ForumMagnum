import React from 'react';
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';

const styles = defineStyles("BetaTag", (theme: ThemeType) => ({
  root: {
    paddingLeft: 4,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: ".9rem",
    color: theme.palette.grey[600],
  }
}));

const BetaTag = () => {
  const classes = useStyles(styles);
  return <span className={classes.root}>[Beta]</span>
}

export default BetaTag;


