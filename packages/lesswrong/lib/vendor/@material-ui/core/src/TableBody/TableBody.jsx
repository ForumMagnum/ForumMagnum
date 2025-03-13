import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '../styles/withStyles';

export const styles = {
  /* Styles applied to the root element. */
  root: {
    display: 'table-row-group',
  },
};

export const Tablelvl2context = React.createContext(null);

const TableBody = (props) => {
  const { classes, className, component: Component='tbody', ...other } = props;

  return <Tablelvl2context.Provider value={{variant: "body"}}>
    <Component className={classNames(classes.root, className)} {...other} /
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
  classes: PropTypes.object.isRequired,
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

export default withStyles(styles, { name: 'MuiTableBody' })(TableBody);
