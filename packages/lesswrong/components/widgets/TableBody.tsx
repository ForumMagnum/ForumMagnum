import React, { createContext } from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';

export const styles = defineStyles("TableBody", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'table-row-group',
  },
}));

export const TableLvl2Context = createContext<string|null>(null);

export function TableBody({className, children}: {
  className?: string
  children?: React.ReactNode
}) {
  const classes = useStyles(styles);

  return <TableLvl2Context.Provider value={"body"}>
    <tbody className={classNames(classes.root, className)}>
      {children}
    </tbody>
  </TableLvl2Context.Provider>
}
