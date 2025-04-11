import React, { createContext } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';

export const styles = defineStyles("Table", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'table',
    fontFamily: theme.typography.fontFamily,
    width: '100%',
    borderCollapse: 'collapse',
    borderSpacing: 0,
  },
}));

export const Table = ({className, children}: {
  className?: string
  children?: React.ReactNode
}) => {
  const classes = useStyles(styles);

  return <table className={classNames(classes.root, className)}>
    {children}
  </table>
}

