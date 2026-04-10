"use client";
import React from 'react';
import classNames from 'classnames';
import ErrorBoundary from "./ErrorBoundary";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

export const SECTION_WIDTH = 765

const styles = defineStyles('SingleColumnSection', (theme: ThemeType) => ({
  root: {
    marginBottom: 32,
    maxWidth: SECTION_WIDTH,
    marginLeft: "auto",
    marginRight: "auto",
    position: "relative",
    zIndex: theme.zIndexes.singleColumnSection,
    [theme.breakpoints.up('md')]: {
      width: SECTION_WIDTH // TODO: replace this hacky solution with a more comprehensive refactoring of SingleColumnSection. 
      // (SingleColumnLayout should probably be replaced by grid-css in Layout.tsx)
    }
  }
}), { stylePriority: -1 })

const SingleColumnSection = ({className, children}: {
  className?: string,
  children?: React.ReactNode,
}) => {
  const classes = useStyles(styles);

  return (
    <ErrorBoundary>
      <div className={classNames(classes.root, className)}>
        { children }
      </div>
    </ErrorBoundary>
  )
};

export default SingleColumnSection;


