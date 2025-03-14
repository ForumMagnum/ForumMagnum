import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { cloneChildrenWithClassName } from '../utils/reactHelpers';

export const styles = defineStyles("MuiDialogActions", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: '0 0 auto',
    margin: '8px 4px',
  },
  /* Styles applied to the children. */
  action: {
    margin: '0 4px',
  },
}), {stylePriority: -10});

function DialogActions(props) {
  const { disableActionSpacing=false, children, classes: classesOverrides, className, ...other } = props;
  const classes = useStyles(styles, classesOverrides);

  return (
    <div className={classNames(classes.root, className)} {...other}>
      {disableActionSpacing ? children : cloneChildrenWithClassName(children, classes.action)}
    </div>
  );
}

DialogActions.propTypes = {
  /**
   * The content of the component.
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
   * If `true`, the dialog actions do not have additional margin.
   */
  disableActionSpacing: PropTypes.bool,
};

export default DialogActions;
