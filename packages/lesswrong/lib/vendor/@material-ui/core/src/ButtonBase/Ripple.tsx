import React, { useRef, useState } from 'react';
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

const Ripple = (props: RippleProps) => {
  const [visible,setVisible] = useState (false);
  const [leaving,setLeaving] = useState(false);

  const handleEnter = () => {
    setVisible(true);
  };

  const handleExit = () => {
    setLeaving(true);
  };

  const {
    classes,
    className: classNameProp,
    pulsate=false,
    rippleX,
    rippleY,
    rippleSize,
    ...other
  } = props;

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
  
  const nodeRef = useRef<HTMLSpanElement>(null);

  return (
    <Transition onEnter={handleEnter} onExit={handleExit} nodeRef={nodeRef} {...other}>
      <span className={rippleClassName} ref={nodeRef} style={rippleStyles}>
        <span className={childClassName} />
      </span>
    </Transition>
  );
}

export default Ripple;
