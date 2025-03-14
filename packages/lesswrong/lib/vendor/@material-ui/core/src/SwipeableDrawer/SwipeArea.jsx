import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { defineStyles, useStyles } from "@/components/hooks/useStyles";
import { capitalize } from '../utils/helpers';
import { isHorizontal } from '../Drawer/Drawer';

export const styles = defineStyles("MuiSwipeArea", theme => ({
  /* Styles applied to the root element. */
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: theme.zIndex.drawer - 1,
  },
  anchorLeft: {
    right: 'auto',
  },
  anchorRight: {
    left: 'auto',
    right: 0,
  },
  anchorTop: {
    bottom: 'auto',
    right: 0,
  },
  anchorBottom: {
    top: 'auto',
    bottom: 0,
    right: 0,
  },
}), {stylePriority: -10});

/**
 * @ignore - internal component.
 */
function SwipeArea(props) {
  const { anchor, classes: classesOverrides, width, ...other } = props;
  const classes = useStyles(styles, classesOverrides);

  return (
    <div
      className={classNames(classes.root, classes[`anchor${capitalize(anchor)}`])}
      style={{
        [isHorizontal(props) ? 'width' : 'height']: width,
      }}
      {...other}
    />
  );
}

SwipeArea.propTypes = {
  /**
   * Side on which to attach the discovery area.
   */
  anchor: PropTypes.oneOf(['left', 'top', 'right', 'bottom']).isRequired,
  /**
   * @ignore
   */
  classes: PropTypes.object,
  /**
   * The width of the left most (or right most) area in pixels where the
   * drawer can be swiped open from.
   */
  width: PropTypes.number.isRequired,
};

export default SwipeArea;
