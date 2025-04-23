import React from 'react';
import classNames from 'classnames';
import Transition from 'react-transition-group/Transition';

interface RippleProps {
  classes: AnyBecauseTodo
  className?: string,
  pulsate?: boolean,
  rippleSize: number,
  rippleX: number,
  rippleY: number
}

/**
 * @ignore - internal component.
 */
class Ripple extends React.Component<RippleProps, {
  visible: boolean
  leaving: boolean
}>{
  state = {
    visible: false,
    leaving: false,
  };

  handleEnter = () => {
    this.setState({
      visible: true,
    });
  };

  handleExit = () => {
    this.setState({
      leaving: true,
    });
  };

  render() {
    const {
      classes,
      className: classNameProp,
      pulsate=false,
      rippleX,
      rippleY,
      rippleSize,
      ...other
    } = this.props;
    const { visible, leaving } = this.state;

    const rippleClassName = classNames(
      classes.ripple,
      {
        [classes.rippleVisible]: visible,
        [classes.ripplePulsate]: pulsate,
      },
      classNameProp,
    );

    const rippleStyles = {
      width: rippleSize,
      height: rippleSize,
      top: -(rippleSize / 2) + rippleY,
      left: -(rippleSize / 2) + rippleX,
    };

    const childClassName = classNames(classes.child, {
      [classes.childLeaving]: leaving,
      [classes.childPulsate]: pulsate,
    });

    return (
      <Transition onEnter={this.handleEnter} onExit={this.handleExit} {...other}>
        <span className={rippleClassName} style={rippleStyles}>
          <span className={childClassName} />
        </span>
      </Transition>
    );
  }
}

export default Ripple;
