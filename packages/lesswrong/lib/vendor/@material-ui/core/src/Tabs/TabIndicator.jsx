import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { capitalize } from '../utils/helpers';

export const styles = defineStyles("MuiTabIndicator", theme => ({
  /* Styles applied to the root element. */
  root: {
    position: 'absolute',
    height: 2,
    bottom: 0,
    width: '100%',
    transition: theme.transitions.create(),
    willChange: 'left, width',
  },
  /* Styles applied to the root element if `color="primary"`. */
  colorPrimary: {
    backgroundColor: theme.palette.primary.main,
  },
  /* Styles applied to the root element if `color="secondary"`. */
  colorSecondary: {
    backgroundColor: theme.palette.secondary.main,
  },
}), {stylePriority: -10});

/**
 * @ignore - internal component.
 */
function TabIndicator(props) {
  const { classes: classesOverrides, className, color, ...other } = props;
  const classes = useStyles(styles, classesOverrides);

  return (
    <span
      className={classNames(classes.root, classes[`color${capitalize(color)}`], className)}
      {...other}
    />
  );
}

TabIndicator.propTypes = {
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
   * @ignore
   * The color of the tab indicator.
   */
  color: PropTypes.oneOf(['primary', 'secondary']),
};

export default TabIndicator;
