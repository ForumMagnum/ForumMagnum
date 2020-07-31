import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib';
import Typography from '@material-ui/core/Typography';

const styles = (theme: ThemeType): JssStyles => ({
  errorText: {
    color: theme.palette.error.main,
  }
})

const ErrorMessage = ({message, classes}: {
  message: string,
  classes: ClassesType,
}) => {
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
