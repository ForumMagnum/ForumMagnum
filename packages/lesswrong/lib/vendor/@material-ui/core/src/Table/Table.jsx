import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

export const styles = defineStyles("MuiTable", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'table',
    fontFamily: theme.typography.fontFamily,
    width: '100%',
    borderCollapse: 'collapse',
    borderSpacing: 0,
  },
}), {stylePriority: -10});

export const TableContext = React.createContext();

const Table = (props) => {
  const { classes: classesOverrides, className, component: Component, padding, ...other } = props;
  const classes = useStyles(styles, classesOverrides);

  return <TableContext.Provider value={{table: {padding: props.padding}}}>
    <Component className={classNames(classes.root, className)} {...other} />
  </TableContext.Provider>;
}

Table.propTypes = {
  /**
   * The content of the table, normally `TableHeader` and `TableBody`.
   */
  children: PropTypes.node.isRequired,
  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: PropTypes.oneOfType([PropTypes.string, PropTypes.func, PropTypes.object]),
  /**
   * Allows TableCells to inherit padding of the Table.
   */
  padding: PropTypes.oneOf(['default', 'checkbox', 'dense', 'none']),
};

Table.defaultProps = {
  component: 'table',
  padding: 'default',
};

export default Table;
