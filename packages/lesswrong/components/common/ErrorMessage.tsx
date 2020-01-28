import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';
import { createStyles } from '@material-ui/core/styles';
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

const ErrorMessageComponent = registerComponent("ErrorMessage", ErrorMessage, {styles});

declare global {
  interface ComponentTypes {
    ErrorMessage: typeof ErrorMessageComponent
  }
}
