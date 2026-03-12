import React from 'react';
import { Typography } from "./Typography";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("ErrorMessage", (theme: ThemeType) => ({
  errorText: {
    color: theme.palette.error.main,
    textAlign: "center",
  }
}))

const ErrorMessage = ({message}: {
  message: string,
}) => {
  const classes = useStyles(styles);
  return <Typography
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
  </Typography>
}

export default ErrorMessage;


