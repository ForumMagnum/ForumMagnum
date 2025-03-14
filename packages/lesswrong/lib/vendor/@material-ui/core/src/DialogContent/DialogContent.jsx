import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

export const styles = defineStyles("MuiDialogContent", theme => ({
  /* Styles applied to the root element. */
  root: {
    flex: '1 1 auto',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch', // Add iOS momentum scrolling.
    padding: '0 24px 24px',
    '&:first-child': {
      paddingTop: 24,
    },
  },
}), {stylePriority: -10});

function DialogContent(props) {
  const { classes: classesOverrides, children, className, ...other } = props;
  const classes = useStyles(styles, classesOverrides);

  return (
    <div className={classNames(classes.root, className)} {...other}>
      {children}
    </div>
  );
}

DialogContent.propTypes = {
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
};

export default DialogContent;
