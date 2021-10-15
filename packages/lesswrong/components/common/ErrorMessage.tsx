import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';

const styles = (theme: ThemeType): JssStyles => ({
  errorText: {
    color: theme.palette.error.main,
    textAlign: "center",
  }
})

const ErrorMessage = ({message, classes}: {
  message: string,
  classes: ClassesType,
}) => {
  return <Components.Typography
    className={classes.errorText}
    variant="body1"
  >
    {/** TODO: seems good to make this section more user friendly.
     * At present it outputs raw error messages like 'app.operation_not_allowed'.
     * FormattedMessage seems like a valuable part of that, but so far I 
     * havent found a way to retrieve the error's `value` property, which
    * FormattedMessage relies on. */}
    {message.startsWith("Error:")
      ? message
      : `Error: ${message}`
    }
  </Components.Typography>
}

const ErrorMessageComponent = registerComponent("ErrorMessage", ErrorMessage, {styles});

declare global {
  interface ComponentTypes {
    ErrorMessage: typeof ErrorMessageComponent
  }
}
