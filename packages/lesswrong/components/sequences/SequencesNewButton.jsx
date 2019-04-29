import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import { Link } from '../../lib/reactRouterWrapper.js';

const styles = theme => ({
  newSequence: {
    color: theme.palette.primary.light
  }
});

export const SequencesNewButton = ({ classes }) => {
  return <Typography className={classes.newSequence} variant="body2"><Link to={"/sequencesnew"}> Create New Sequence </Link></Typography>
}

registerComponent('SequencesNewButton', SequencesNewButton, withStyles(styles, { name: "SequencesNewButton" }));