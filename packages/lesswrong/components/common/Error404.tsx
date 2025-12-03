"use client";
import React, { Suspense, use } from 'react';
import SingleColumnSection from "./SingleColumnSection";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { StatusCodeSetter } from '../next/StatusCodeSetter';

const styles = defineStyles('Error404', (theme: ThemeType) => ({
  root: {
    fontFamily: theme.isFriendlyUI ? theme.palette.fonts.sansSerifStack : theme.palette.fonts.serifStack,
  },
}));

const Error404 = () => {
  const classes = useStyles(styles);
  
  return (
    <SingleColumnSection className={classes.root}>
      <StatusCodeSetter status={404}/>
      <h2>404 Not Found</h2>
      <h3>Sorry, we couldn't find what you were looking for.</h3>

      <Suspense>
        <TrivialSuspender/>
      </Suspense>
    </SingleColumnSection>
  );
};

function TrivialSuspender() {
  use(Promise.resolve());
  return null;
}

export default Error404;


