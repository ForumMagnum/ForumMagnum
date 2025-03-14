import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

export const styles = defineStyles("MuiListItemSecondaryAction", theme => ({
  /* Styles applied to the root element. */
  root: {
    position: 'absolute',
    right: 4,
    top: '50%',
    transform: 'translateY(-50%)',
  },
}), {stylePriority: -10});

function ListItemSecondaryAction(props) {
  const { children, classes: classesOverrides, className, ...other } = props;
  const classes = useStyles(styles, classesOverrides);

  return (
    <div className={classNames(classes.root, className)} {...other}>
      {children}
    </div>
  );
}

ListItemSecondaryAction.propTypes = {
  /**
   * The content of the component, normally an `IconButton` or selection control.
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
};

ListItemSecondaryAction.muiName = 'ListItemSecondaryAction';

export default ListItemSecondaryAction;
