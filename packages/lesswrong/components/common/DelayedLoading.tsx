import React from 'react';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import classNames from 'classnames';

const styles = defineStyles("DelayedLoading", (theme: ThemeType) => ({
  spinner: {
    height: 10,
    maxWidth: 100,
    textAlign: "center",
    display: "block",
    marginLeft: "auto",
    marginRight: "auto",
  
    "& div": {
      width: 10,
      height: 10,
      backgroundColor: theme.palette.icon.loadingDots,
  
      borderRadius: "100%",
      display: "inline-block",
      "-webkit-animation": "sk-bouncedelay 1.4s infinite ease-in-out both",
      animation: "sk-bouncedelay 1.4s infinite ease-in-out both",
    },
  },
  whiteSpinner: {
    "& div": {
      backgroundColor: theme.palette.icon.loadingDotsAlternate,
    }
  },
  bounce1: {
    animationDelay: "0.68s !important",
    marginRight: 5,
  },

  bounce2: {
    animationDelay: "0.84s !important",
    marginRight: 5,
  },
  bounce3: {
    animationDelay: "1.0s !important",
    marginRight: 0,
  },
  
  "@keyframes sk-bouncedelay": {
    "0%, 80%, 100%": {
      transform: "scale(0)",
    },
    "40%": {
      transform: "scale(1.0)"
    }
  }
}))

/**
 * Similar to the <Loading> component, except that the animation waits 1.0s
 * before appearing. Use in contexts where a loading placeholder might be
 * necessary, but would look bad if the load turns out to be fast.
 */
export const DelayedLoading = ({className, white}: {
  className?: string,
  white?: boolean
}) => {
  const classes = useStyles(styles);
  return (
    <div className={classNames(classes.spinner, className, {[classes.whiteSpinner]: white})}>
      <div className={classes.bounce1}></div>
      <div className={classes.bounce2}></div>
      <div className={classes.bounce3}></div>
    </div>
  );
}
