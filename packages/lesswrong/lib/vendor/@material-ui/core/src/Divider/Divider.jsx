import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { fade } from '../styles/colorManipulator';

export const styles = defineStyles("MuiDivider", theme => ({
  /* Styles applied to the root element. */
  root: {
    height: 1,
    margin: 0, // Reset browser default style.
    border: 'none',
    flexShrink: 0,
    backgroundColor: theme.palette.divider,
  },
  /* Styles applied to the root element if `absolute={true}`. */
  absolute: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
  },
  /* Styles applied to the root element if `inset={true}`. */
  inset: {
    marginLeft: 72,
  },
  /* Styles applied to the root element if `light={true}`. */
  light: {
    backgroundColor: fade(theme.palette.divider, 0.08),
  },
}), {stylePriority: -10});

function Divider(props) {
  const {
    absolute=false,
    classes: classesOverrides,
    className: classNameProp,
    component: Component='hr',
    inset=false,
    light=false,
    ...other
  } = props;
  const classes = useStyles(styles, classesOverrides);

  const className = classNames(
    classes.root,
    {
      [classes.absolute]: absolute,
      [classes.inset]: inset,
      [classes.light]: light,
    },
    classNameProp,
  );

  return <Component className={className} {...other} />;
}

Divider.propTypes = {
  absolute: PropTypes.bool,
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
   * If `true`, the divider will be indented.
   */
  inset: PropTypes.bool,
  /**
   * If `true`, the divider will have a lighter color.
   */
  light: PropTypes.bool,
};

export default Divider;
