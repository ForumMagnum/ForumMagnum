// @inheritedComponent ButtonBase

import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import withStyles from '../styles/withStyles';
import ButtonBase from '../ButtonBase';
import StepLabel from '../StepLabel';
import { isMuiElement } from '../utils/reactHelpers';

export const styles = {
  /* Styles applied to the root element. */
  root: {
    width: '100%',
    padding: '24px 16px',
    margin: '-24px -16px',
    boxSizing: 'content-box',
  },
  /* Styles applied to the root element if `orientation="horizontal"`. */
  horizontal: {},
  /* Styles applied to the root element if `orientation="vertical"`. */
  vertical: {
    justifyContent: 'flex-start',
  },
  /* Styles applied to the `ButtonBase` touch-ripple. */
  touchRipple: {
    color: 'rgba(0, 0, 0, 0.3)',
  },
};

function StepButton(props) {
  const {
    active,
    alternativeLabel,
    children,
    classes,
    className: classNameProp,
    completed,
    disabled,
    icon,
    last,
    optional,
    orientation,
    ...other
  } = props;

  const childProps = {
    active,
    alternativeLabel,
    completed,
    disabled,
    icon,
    optional,
    orientation,
  };
  const child = isMuiElement(children, ['StepLabel']) ? (
    React.cloneElement(children, childProps)
  ) : (
    <StepLabel {...childProps}>{children}</StepLabel>
  );

  return (
    <ButtonBase
      disabled={disabled}
      TouchRippleProps={{ className: classes.touchRipple }}
      className={classNames(classes.root, classes[orientation], classNameProp)}
      {...other}
    >
      {child}
    </ButtonBase>
  );
}

StepButton.propTypes = {
  /**
   * @ignore
   * Passed in via `Step` - passed through to `StepLabel`.
   */
  active: PropTypes.bool,
  /**
   * @ignore
   * Set internally by Stepper when it's supplied with the alternativeLabel property.
   */
  alternativeLabel: PropTypes.bool,
  /**
   * Can be a `StepLabel` or a node to place inside `StepLabel` as children.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   * See [CSS API](#css-api) below for more details.
   */
  classes: PropTypes.object.isRequired,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * @ignore
   * Sets completed styling. Is passed to StepLabel.
   */
  completed: PropTypes.bool,
  /**
   * @ignore
   * Disables the button and sets disabled styling. Is passed to StepLabel.
   */
  disabled: PropTypes.bool,
  /**
   * The icon displayed by the step label.
   */
  icon: PropTypes.node,
  /**
   * @ignore
   */
  last: PropTypes.bool,
  /**
   * The optional node to display.
   */
  optional: PropTypes.node,
  /**
   * @ignore
   */
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
};

export default withStyles(styles, { name: 'MuiStepButton' })(StepButton);
