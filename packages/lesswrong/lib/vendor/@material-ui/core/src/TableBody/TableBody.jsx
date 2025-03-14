import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

export const styles = defineStyles("MuiTableBody", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'table-row-group',
  },
}), {stylePriority: -10});

export const Tablelvl2context = React.createContext(null);

const TableBody = (props) => {
  const { classes: classesOverrides, className, component: Component='tbody', ...other } = props;
  const classes = useStyles(styles, classesOverrides);

  return <Tablelvl2context.Provider value={{variant: "body"}}>
    <Component className={classNames(classes.root, className)} {...other} />
  </Tablelvl2context.Provider>;
}

TableBody.propTypes = {
  /**
   * The content of the component, normally `TableRow`.
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
};

export default TableBody;
