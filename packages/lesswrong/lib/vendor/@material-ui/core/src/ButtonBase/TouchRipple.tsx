import React, { useRef, useState } from 'react';
import TransitionGroup, { TransitionGroupProps } from 'react-transition-group/TransitionGroup';
import classNames from 'classnames';
import Transition from 'react-transition-group/Transition';
import { defineStyles, useStyles, withStyles } from '@/components/hooks/useStyles';
import { StandardProps } from '..';

export type TouchRippleProps = StandardProps<
  TransitionGroupProps,
  TouchRippleClassKey
> & {
  className?: string;
  center?: boolean;
};

export type TouchRippleClassKey =
  | 'root'
  | 'ripple'
  | 'rippleVisible'
  | 'ripplePulsate'
  | 'child'
  | 'childLeaving'
  | 'childPulsate';

const DURATION = 550;
export const DELAY_RIPPLE = 80;

export const styles = defineStyles("MuiTouchRipple", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'block',
    position: 'absolute',
    overflow: 'hidden',
    borderRadius: 'inherit',
    width: '100%',
    height: '100%',
    left: 0,
    top: 0,
    pointerEvents: 'none',
    zIndex: 0,
  },
  /* Styles applied to the internal `Ripple` components `ripple` class. */
  ripple: {
    width: 50,
    height: 50,
    left: 0,
    top: 0,
    opacity: 0,
    position: 'absolute',
  },
  /* Styles applied to the internal `Ripple` components `rippleVisible` class. */
  rippleVisible: {
    opacity: 0.3,
    transform: 'scale(1)',
    animation: `mui-ripple-enter ${DURATION}ms ${theme.transitions.easing.easeInOut}`,
  },
  /* Styles applied to the internal `Ripple` components `ripplePulsate` class. */
  ripplePulsate: {
    animationDuration: `${theme.transitions.duration.shorter}ms`,
  },
  /* Styles applied to the internal `Ripple` components `child` class. */
  child: {
    opacity: 1,
    display: 'block',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: 'currentColor',
  },
  /* Styles applied to the internal `Ripple` components `childLeaving` class. */
  childLeaving: {
    opacity: 0,
    animation: `mui-ripple-exit ${DURATION}ms ${theme.transitions.easing.easeInOut}`,
  },
  /* Styles applied to the internal `Ripple` components `childPulsate` class. */
  childPulsate: {
    position: 'absolute',
    left: 0,
    top: 0,
    animation: `mui-ripple-pulsate 2500ms ${theme.transitions.easing.easeInOut} 200ms infinite`,
  },
  '@keyframes mui-ripple-enter': {
    '0%': {
      transform: 'scale(0)',
      opacity: 0.1,
    },
    '100%': {
      transform: 'scale(1)',
      opacity: 0.3,
    },
  },
  '@keyframes mui-ripple-exit': {
    '0%': {
      opacity: 1,
    },
    '100%': {
      opacity: 0,
    },
  },
  '@keyframes mui-ripple-pulsate': {
    '0%': {
      transform: 'scale(1)',
    },
    '50%': {
      transform: 'scale(0.92)',
    },
    '100%': {
      transform: 'scale(1)',
    },
  },
}), {stylePriority: -10});

class TouchRipple extends React.PureComponent<TouchRippleProps & WithStylesProps<typeof styles>, {
  ripples: AnyBecauseTodo
  nextKey: AnyBecauseTodo
}> {
  wrapperRef = React.createRef<HTMLSpanElement|null>();

  // Used to filter out mouse emulated events on mobile.
  ignoringMouseDown = false;

  // We use a timer in order to only show the ripples for touch "click" like events.
  // We don't want to display the ripple for touch scroll events.
  startTimer: ReturnType<typeof setTimeout>|null = null

  // This is the hook called once the previous timeout is ready.
  startTimerCommit: (() => void)|null = null;

  state = {
    // eslint-disable-next-line react/no-unused-state
    nextKey: 0,
    ripples: [],
  };

  componentWillUnmount() {
    if (this.startTimer) {
      clearTimeout(this.startTimer);
    }
  }

  pulsate = () => {
    this.start({}, { pulsate: true });
  };

  start = (event: AnyBecauseTodo = {}, options: AnyBecauseTodo = {}, cb?: AnyBecauseTodo) => {
    const {
      pulsate = false,
      center = this.props.center || options.pulsate,
      fakeElement = false, // For test purposes
    } = options;

    if (event.type === 'mousedown' && this.ignoringMouseDown) {
      this.ignoringMouseDown = false;
      return;
    }

    if (event.type === 'touchstart') {
      this.ignoringMouseDown = true;
    }

    //const element: Element|null = fakeElement ? null : ReactDOM.findDOMNode(this);
    const element: Element|null = fakeElement ? null : this.wrapperRef.current
    const rect = element
      ? element.getBoundingClientRect()
      : {
          width: 0,
          height: 0,
          left: 0,
          top: 0,
        };

    // Get the size of the ripple
    let rippleX;
    let rippleY;
    let rippleSize;

    if (
      center ||
      (event.clientX === 0 && event.clientY === 0) ||
      (!event.clientX && !event.touches)
    ) {
      rippleX = Math.round(rect.width / 2);
      rippleY = Math.round(rect.height / 2);
    } else {
      const clientX = event.clientX ? event.clientX : event.touches[0].clientX;
      const clientY = event.clientY ? event.clientY : event.touches[0].clientY;
      rippleX = Math.round(clientX - rect.left);
      rippleY = Math.round(clientY - rect.top);
    }

    if (center) {
      rippleSize = Math.sqrt((2 * rect.width ** 2 + rect.height ** 2) / 3);

      // For some reason the animation is broken on Mobile Chrome if the size if even.
      if (rippleSize % 2 === 0) {
        rippleSize += 1;
      }
    } else {
      const sizeX =
        Math.max(Math.abs((element ? element.clientWidth : 0) - rippleX), rippleX) * 2 + 2;
      const sizeY =
        Math.max(Math.abs((element ? element.clientHeight : 0) - rippleY), rippleY) * 2 + 2;
      rippleSize = Math.sqrt(sizeX ** 2 + sizeY ** 2);
    }

    // Touche devices
    if (event.touches) {
      // Prepare the ripple effect.
      this.startTimerCommit = () => {
        this.startCommit({ pulsate, rippleX, rippleY, rippleSize, cb });
      };
      // Deplay the execution of the ripple effect.
      this.startTimer = setTimeout(() => {
        if (this.startTimerCommit) {
          this.startTimerCommit();
          this.startTimerCommit = null;
        }
      }, DELAY_RIPPLE); // We have to make a tradeoff with this value.
    } else {
      this.startCommit({ pulsate, rippleX, rippleY, rippleSize, cb });
    }
  };

  startCommit = (params: AnyBecauseTodo) => {
    const { pulsate, rippleX, rippleY, rippleSize, cb } = params;

    this.setState(state => {
      return {
        nextKey: state.nextKey + 1,
        ripples: [
          ...state.ripples,
          <Ripple
            key={state.nextKey}
            pulsate={pulsate}
            rippleX={rippleX}
            rippleY={rippleY}
            rippleSize={rippleSize}
          />,
        ],
      };
    }, cb);
  };

  stop = (event: AnyBecauseTodo, cb: AnyBecauseTodo) => {
    if (this.startTimer) {
      clearTimeout(this.startTimer);
    }
    const { ripples } = this.state;

    // The touch interaction occurs too quickly.
    // We still want to show ripple effect.
    if (event.type === 'touchend' && this.startTimerCommit) {
      event.persist();
      this.startTimerCommit();
      this.startTimerCommit = null;
      this.startTimer = setTimeout(() => {
        this.stop(event, cb);
      }, 0);
      return;
    }

    this.startTimerCommit = null;

    if (ripples && ripples.length) {
      this.setState(
        {
          ripples: ripples.slice(1),
        },
        cb,
      );
    }
  };

  render() {
    const { center=false, classes, className, ref, ...other } = this.props;

    return (
      <span ref={this.wrapperRef} className={classNames(classes.root, className)}>
        {this.state.ripples.length > 0 && <TransitionGroup
          component={null}
          enter
          exit
          {...other}
        >
          {this.state.ripples}
        </TransitionGroup>}
      </span>
    );
  }
}

interface RippleProps {
  className?: string,
  pulsate?: boolean,
  rippleSize: number,
  rippleX: number,
  rippleY: number
}

const Ripple = (props: RippleProps) => {
  const [visible,setVisible] = useState(false);
  const [leaving,setLeaving] = useState(false);
  const classes = useStyles(styles);

  const handleEnter = () => {
    setVisible(true);
  };

  const handleExit = () => {
    setLeaving(true);
  };

  const {
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
    <Transition
      onEnter={handleEnter} onExit={handleExit}
      nodeRef={nodeRef}
      timeout={DURATION}
      {...other}
    >
      <span className={rippleClassName} ref={nodeRef} style={rippleStyles}>
        <span className={childClassName} />
      </span>
    </Transition>
  );
}

export default withStyles(styles, TouchRipple);
