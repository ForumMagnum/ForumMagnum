import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";

export const styles = defineStyles("MuiToolbar", theme => ({
  /* Styles applied to the root element. */
  root: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  /* Styles applied to the root element if `disableGutters={false}`. */
  gutters: theme.mixins.gutters(),
  /* Styles applied to the root element if `variant="regular"`. */
  regular: theme.mixins.toolbar,
  /* Styles applied to the root element if `variant="dense"`. */
  dense: {
    minHeight: 48,
  },
}));

function Toolbar(props) {
  const { children, className: classNameProp, disableGutters=false, variant="regular", ...other } = props;
  const classes = useStyles(styles);

  const className = classNames(
    classes.root,
    classes[variant],
    {
      [classes.gutters]: !disableGutters,
    },
    classNameProp,
  );

  return (
    <div className={className} {...other}>
      {children}
    </div>
  );
}

Toolbar.propTypes = {
  /**
   * Toolbar children, usually a mixture of `IconButton`, `Button` and `Typography`.
   */
  children: PropTypes.node,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * If `true`, disables gutter padding.
   */
  disableGutters: PropTypes.bool,
  /**
   * The variant to use.
   */
  variant: PropTypes.oneOf(['regular', 'dense']),
};

export default Toolbar;
