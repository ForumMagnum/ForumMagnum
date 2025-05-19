import React from 'react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { TableLvl2Context } from './TableBody';

export const styles = defineStyles("TableFooter", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'table-footer-group',
  },
}));

export const TableFooter = ({className, children}: {
  className?: string
  children?: React.ReactNode
}) => {
  const classes = useStyles(styles);

  return <TableLvl2Context.Provider value={"footer"}>
    <tfoot className={classNames(classes.root, className)}>
      {children}
    </tfoot>
  </TableLvl2Context.Provider>
}
