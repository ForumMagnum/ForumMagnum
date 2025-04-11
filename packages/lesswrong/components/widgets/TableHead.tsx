import React from 'react';
import classNames from 'classnames';
import { TableLvl2Context } from './TableBody';
import { defineStyles, useStyles } from '../hooks/useStyles';

export const styles = defineStyles("TableHead", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'table-header-group',
  },
}));

export function TableHead({className, children}: {
  className?: string
  children?: React.ReactNode
}) {
  const classes = useStyles(styles);

  return <TableLvl2Context.Provider value={"head"}>
    <thead className={classNames(classes.root, className)}>
      {children}
    </thead>
  </TableLvl2Context.Provider>
}
