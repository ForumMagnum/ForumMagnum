import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';

const RADIUS = 11;

const styles = defineStyles("Badge", theme => ({
  /* Styles applied to the root element. */
  root: {
    position: 'relative',
    display: 'inline-flex',
    // For correct alignment with the text.
    verticalAlign: 'middle',
  },
  /* Styles applied to the badge `span` element. */
  badge: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -RADIUS,
    right: -RADIUS,
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    width: RADIUS * 2,
    height: RADIUS * 2,
    borderRadius: '50%',
    color: theme.palette.text.normal,
    zIndex: 1, // Render the badge on top of potential ripples.
  },
  /* Styles applied to the root element if `color="primary"`. */
  colorPrimary: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  },
  /* Styles applied to the root element if `color="secondary"`. */
  colorSecondary: {
    backgroundColor: theme.palette.secondary.main,
    color: theme.palette.secondary.contrastText,
  },
  /* Styles applied to the root element if `color="error"`. */
  colorError: {
    backgroundColor: theme.palette.error.main,
    color: theme.palette.error.contrastText,
  },
}), {stylePriority: -1});

export const Badge = ({badgeContent, className, badgeClassName, children}: {
  badgeContent: React.ReactNode
  className?: string,
  badgeClassName?: string,
  children: React.ReactNode
}) => {
  const classes = useStyles(styles);
  return (
    <span className={classNames(classes.root, className)}>
      {children}
      <span className={classNames(classes.badge, badgeClassName)}>{badgeContent}</span>
    </span>
  );
}
