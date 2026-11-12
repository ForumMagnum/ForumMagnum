"use client";
import React from 'react';
import SingleColumnSection from "./SingleColumnSection";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { StatusCodeSetter } from '../next/StatusCodeSetter';

const styles = defineStyles('ErrorBadRequest', (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.serifStack,
  },
}));

/**
 * Error page for requests that are malformed, eg because of invalid query
 * parameters. Sets a 400 status code, so the page using it must be wrapped in
 * <RouteRoot delayedStatusCode>.
 */
const ErrorBadRequest = ({message}: {message: string}) => {
  const classes = useStyles(styles);
  return (
    <SingleColumnSection className={classes.root}>
      <StatusCodeSetter status={400}/>
      <h2>400 Bad Request</h2>
      <h3>{message}</h3>
    </SingleColumnSection>
  );
};

export default ErrorBadRequest;
