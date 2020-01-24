import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { withStyles, createStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';

const styles = createStyles(theme => ({
  errorText: {
    color: theme.palette.error.main,
  }
}))

const ErrorMessage = ({message, classes}) => {
  return <Typography
    className={classes.errorText}
    align="center"
    variant="body1"
  >
    Error: {message}
  </Typography>
}

registerComponent("ErrorMessage", ErrorMessage, withStyles(styles, { name: "ErrorMessage" }));
