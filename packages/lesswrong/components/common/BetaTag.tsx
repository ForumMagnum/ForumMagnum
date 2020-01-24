import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles, createStyles } from '@material-ui/core/styles';

const styles = createStyles((theme) => ({
  root: {
    paddingLeft: 4,
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    fontSize: ".9rem",
    color: theme.palette.grey[600],
  }
}));

const BetaTag = ({classes}) => {
  return <span className={classes.root}>[Beta]</span>
}

registerComponent('BetaTag', BetaTag, withStyles(styles, {name: 'BetaTag'}))
