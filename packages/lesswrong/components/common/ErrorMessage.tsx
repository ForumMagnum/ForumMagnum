import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';

const styles = (theme: ThemeType) => ({
  errorText: {
    color: theme.palette.error.main,
    textAlign: "center",
  }
})

const ErrorMessageInner = ({message, classes}: {
  message: string,
  classes: ClassesType<typeof styles>,
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

export const ErrorMessage = registerComponent("ErrorMessage", ErrorMessageInner, {styles});

declare global {
  interface ComponentTypes {
    ErrorMessage: typeof ErrorMessage
  }
}
