import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import Slide from '@/lib/vendor/@material-ui/core/src/Slide';

export const styles = defineStyles("MuiSnackbar", theme => ({
  root: {
    zIndex: theme.zIndexes.snackbar,
    position: 'fixed',
    display: 'flex',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 0,
  },
  snackbar: {
    transition: 'transform .4s ease-in-out',
    bottom: 0,
    [theme.breakpoints.up('md')]: {
      left: '50%',
      right: 'auto',
    },
  },
  enter: {
    transform: 'translateY(0)',
    [theme.breakpoints.up('md')]: {
      transform: 'translateY(0)',
    },
  },
  exit: {
    transform: 'translateY(50px)',
    [theme.breakpoints.up('md')]: {
      transform: 'translateY(50px)',
    },
  },
}));

// Derived from material-UI Snackbar

export const Snackbar = (props: {
  className?: string,
  open: boolean,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const {
    children,
    className,
    open,
  } = props;

  return (
    <div
      className={classes.root}
    >
      <div className={classNames(
        classes.snackbar,
        open ? classes.enter : classes.exit,
        className
      )}>
        {children}
      </div>
    </div>
  );
}
