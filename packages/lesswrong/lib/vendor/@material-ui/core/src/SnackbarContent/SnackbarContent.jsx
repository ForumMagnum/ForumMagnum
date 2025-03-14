// @inheritedComponent Paper

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import Paper from '../Paper';
import Typography from '../Typography';
import { emphasize } from '../styles/colorManipulator';

export const styles = defineStyles("MuiSnackbarContent", theme => {
  const emphasis = theme.palette.type === 'light' ? 0.8 : 0.98;
  const backgroundColor = emphasize(theme.palette.background.default, emphasis);

  return {
    /* Styles applied to the root element. */
    root: {
      color: theme.palette.getContrastText(backgroundColor),
      backgroundColor,
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      padding: '6px 24px',
      [theme.breakpoints.up('md')]: {
        minWidth: 288,
        maxWidth: 568,
        borderRadius: theme.shape.borderRadius,
      },
      [theme.breakpoints.down('sm')]: {
        flexGrow: 1,
      },
    },
    /* Styles applied to the message wrapper element. */
    message: {
      padding: '8px 0',
    },
    /* Styles applied to the action wrapper element if `action` is provided. */
    action: {
      display: 'flex',
      alignItems: 'center',
      marginLeft: 'auto',
      paddingLeft: 24,
      marginRight: -8,
    },
  };
}, {stylePriority: -10});

function SnackbarContent(props) {
  const { action, classes: classesOverrides, className, message, ...other } = props;
  const classes = useStyles(styles, classesOverrides);

  return (
    <Paper
      component={Typography}
      headlineMapping={{
        body1: 'div',
      }}
      role="alertdialog"
      square
      elevation={6}
      className={classNames(classes.root, className)}
      {...other}
    >
      <div className={classes.message}>{message}</div>
      {action ? <div className={classes.action}>{action}</div> : null}
    </Paper>
  );
}

SnackbarContent.propTypes = {
  /**
   * The action to display.
   */
  action: PropTypes.node,
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
   * The message to display.
   */
  message: PropTypes.node,
};

export default SnackbarContent;
