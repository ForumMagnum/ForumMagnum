import React, { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';

export const styles = defineStyles("MuiSnackbar", theme => ({
  root: {
    zIndex: theme.zIndexes.snackbar,
    position: 'fixed',
    display: 'flex',
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'transform 0.4s ease-in-out, opacity 0.4s ease-in-out',

    bottom: 0,
    [theme.breakpoints.up('md')]: {
      left: '50%',
      right: 'auto',
      transform: 'translateX(-50%)',
    },
  },
  enter: {
    transform: 'translateY(0)',
    [theme.breakpoints.up('md')]: {
      transform: 'translateX(-50%) translateY(0)',
    },
  },
  exit: {
    transform: 'translateY(100%)',
    [theme.breakpoints.up('md')]: {
      transform: 'translateX(-50%) translateY(100%)',
    },
  },
}));

// Derived from material-UI Snackbar

export const Snackbar = (props: {
  autoHideDuration: number,
  className?: string,
  onClose: () => void,
  open: boolean,
  resumeHideDuration?: number,
  children: React.ReactNode,
}) => {
  const classes = useStyles(styles);
  const {
    autoHideDuration,
    children,
    className,
    onClose,
    open,
    resumeHideDuration,
  } = props;

  const autoHideTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  // Timer that controls delay before snackbar auto hides
  const setAutoHideTimer = useCallback((autoHideDuration?: number) => {
    const autoHideDurationBefore = autoHideDuration ?? props.autoHideDuration;

    if (!onClose || autoHideDurationBefore == null) {
      return -1;
    }

    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
    }
    autoHideTimer.current = setTimeout(() => {
      const autoHideDurationAfter = autoHideDuration ?? props.autoHideDuration;
      if (!onClose || autoHideDurationAfter == null) {
        return;
      }

      onClose();
    }, autoHideDurationBefore);
  }, [onClose, props.autoHideDuration]);

  const handleMouseEnter = (event: React.MouseEvent) => {
    handlePause();
  };

  const handleMouseLeave = (event: React.MouseEvent) => {
    handleResume();
  };

  // Pause the timer when the user is interacting with the Snackbar
  // or when the user hide the window.
  const handlePause = useCallback(() => {
    if (autoHideTimer.current) {
      clearTimeout(autoHideTimer.current);
      autoHideTimer.current = null;
    }
  }, []);

  // Restart the timer when the user is no longer interacting with the Snackbar
  // or when the window is shown back.
  const handleResume = useCallback(() => {
    if (autoHideDuration != null) {
      if (resumeHideDuration != null) {
        setAutoHideTimer(resumeHideDuration);
        return;
      }
      setAutoHideTimer(autoHideDuration * 0.5);
    }
  }, [autoHideDuration, resumeHideDuration, setAutoHideTimer]);

  useEffect(() => {
    setAutoHideTimer();
    return () => {
      handlePause();
    };
  }, [open, setAutoHideTimer, handlePause]);

  useEffect(() => {
    window.addEventListener("focus", handleResume);
    window.addEventListener("blur", handlePause);
  }, [handlePause, handleResume]);

  // So we only render active snackbars.
  if (!open) {
    return null;
  }
  
  return (
    <div
      className={classNames(
        classes.root,
        open ? classes.enter : classes.exit,
        className,
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
}
