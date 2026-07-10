import React from 'react';
import { defineStyles, useStyles } from '../hooks/useStyles';

const styles = defineStyles("UltraFeedErrorFallback", (theme: ThemeType) => ({
  root: {
    ...theme.typography.commentStyle,
    padding: 16,
    margin: "16px 0",
    borderRadius: 3,
    border: theme.palette.greyBorder("1px", 0.15),
    background: theme.palette.greyAlpha(0.04),
    color: theme.palette.text.dim,
    textAlign: "center",
  },
}));

const UltraFeedErrorFallback = ({ message = "The feed couldn't load. Other front page sections are still available." }: {
  message?: string,
}) => {
  const classes = useStyles(styles);
  return <div className={classes.root}>{message}</div>;
};

export default UltraFeedErrorFallback;
