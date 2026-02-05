"use client";
import React from 'react';
import SingleColumnSection from "./SingleColumnSection";
import { defineStyles, useStyles } from '../hooks/useStyles';
import { StatusCodeSetter } from '../next/StatusCodeSetter';
import { canonicalizePath } from '@/lib/generated/routeManifest';
import PermanentRedirect from './PermanentRedirect';
import { useLocation } from '@/lib/routeUtil';
import qs from 'qs';

const styles = defineStyles('Error404', (theme: ThemeType) => ({
  root: {
    fontFamily: theme.isFriendlyUI ? theme.palette.fonts.sansSerifStack : theme.palette.fonts.serifStack,
  },
}));

const Error404 = () => {
  const classes = useStyles(styles);

  // Before NextJS, we were using react-router, which wasn't case-sensitive by default.
  // To solve the problem of any existing links going to non-canonically-capitalized paths,
  // we have a codegen step that generates a trie which we use to find a matching canonical
  // path (if one exists). Use that on the 404 page, so that if you go to a route that
  // exists but with the wrong capitalization, it will serve a redirect to the corrected
  // page.
  const location = useLocation();
  const { pathname, query, hash } = location;
  const canonicalPathname = canonicalizePath(pathname);
  if (canonicalPathname && canonicalPathname !== location.pathname) {
    const redirectTarget = `${canonicalPathname}${query ? `?${qs.stringify(query)}` : ''}${hash ? `#${hash}` : ''}`;
    return <PermanentRedirect url={redirectTarget}/>
  }

  return (
    <SingleColumnSection className={classes.root}>
      <StatusCodeSetter status={404}/>
      <h2>404 Not Found</h2>
      <h3>Sorry, we couldn't find what you were looking for.</h3>
    </SingleColumnSection>
  );
};

export default Error404;
