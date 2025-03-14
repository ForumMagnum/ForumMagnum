// @inheritedComponent Paper

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import Paper from '../Paper';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

export const styles = defineStyles("MuiCard", theme => ({
  /* Styles applied to the root element. */
  root: {
    overflow: 'hidden',
  },
}), {stylePriority: -10});

function Card(props) {
  const { classes: classesOverrides, className, raised=false, ...other } = props;
  const classes = useStyles(styles, classesOverrides);

  return (
    <Paper className={classNames(classes.root, className)} elevation={raised ? 8 : 1} {...other} />
  );
}

Card.propTypes = {
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
   * If `true`, the card will use raised styling.
   */
  raised: PropTypes.bool,
};

export default Card;
