import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import KeyboardArrowLeft from '../internal/svg-icons/KeyboardArrowLeft';
import KeyboardArrowRight from '../internal/svg-icons/KeyboardArrowRight';
import withStyles from '../styles/withStyles';
import ButtonBase from '../ButtonBase';

export const styles = {
  /* Styles applied to the root element. */
  root: {
    color: 'inherit',
    flex: '0 0 56px',
  },
};

/**
 * @ignore - internal component.
 */
function TabScrollButton(props) {
  const { classes, className: classNameProp, direction, onClick, visible, ...other } = props;

  const className = classNames(classes.root, classNameProp);

  if (!visible) {
    return <div className={className} />;
  }

  return (
    <ButtonBase className={className} onClick={onClick} tabIndex={-1} {...other}>
      {direction === 'left' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
    </ButtonBase>
  );
}

TabScrollButton.propTypes = {
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
   * Which direction should the button indicate?
   */
  direction: PropTypes.oneOf(['left', 'right']),
  /**
   * Callback to execute for button press.
   */
  onClick: PropTypes.func,
  /**
   * Should the button be present or just consume space.
   */
  visible: PropTypes.bool,
};

TabScrollButton.defaultProps = {
  visible: true,
};

export default withStyles(styles, { name: 'MuiTabScrollButton' })(TabScrollButton);
