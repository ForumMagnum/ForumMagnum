// @inheritedComponent Typography

import React from 'react';
import PropTypes from 'prop-types';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import Typography from '../Typography';

export const styles = defineStyles("MuiDialogContentText", theme => ({
  /* Styles applied to the root element. */
  root: {},
}), {stylePriority: -10});

function DialogContentText(props) {
  const classes = useStyles(styles, props.classes);
  return <Typography component="p" variant="subheading" color="textSecondary" classes={classes} {...props} />;
}

DialogContentText.propTypes = {
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: PropTypes.object,
};

export default DialogContentText;
