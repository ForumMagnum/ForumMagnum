// @inheritedComponent ListItem

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import ListItem from '../ListItem';

export const styles = defineStyles("MuiMenuItem", theme => ({
  /* Styles applied to the root element. */
  root: {
    ...theme.typography.subheading,
    height: 24,
    boxSizing: 'content-box',
    width: 'auto',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    paddingLeft: 16,
    paddingRight: 16,
    '&$selected': {},
  },
  /* Styles applied to the root element if `selected={true}`. */
  selected: {},
}), {stylePriority: -10});

function MenuItem(props) {
  const { classes: classesOverrides, className, component='li', selected, role='menuitem', ...other } = props;
  const classes = useStyles(styles, classesOverrides);

  return (
    <ListItem
      button
      role={role}
      tabIndex={-1}
      selected={selected}
      className={classNames(classes.root, { [classes.selected]: selected }, className)}
      component={component}
      {...other}
    />
  );
}

MenuItem.propTypes = {
  /**
   * Menu item contents.
   */
  children: PropTypes.node,
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
   * @ignore
   */
  role: PropTypes.string,
  /**
   * @ignore
   */
  selected: PropTypes.bool,
};

export default MenuItem;
