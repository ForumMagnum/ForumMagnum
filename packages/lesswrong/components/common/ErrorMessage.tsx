import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  errorText: {
    color: theme.palette.error.main,
  }
})

const ErrorMessage = ({message, classes}: {
  message: string,
  classes: ClassesType,
}) => {
  return <Components.Typography
    className={classes.errorText}
    align="center"
    variant="body1"
  >
    Error: {message}
  </Components.Typography>
}

const ErrorMessageComponent = registerComponent("ErrorMessage", ErrorMessage, {styles});

declare global {
  interface ComponentTypes {
    ErrorMessage: typeof ErrorMessageComponent
  }
}
