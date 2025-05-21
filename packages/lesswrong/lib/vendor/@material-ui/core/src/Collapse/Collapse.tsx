import React, { useRef } from 'react';
import classNames from 'classnames';
import Transition from 'react-transition-group/Transition';
import { duration } from '../styles/transitions';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';

export interface CollapseProps {
  children?: React.ReactNode;
  in?: boolean;
  className?: string;
  onEnter?: (node: AnyBecauseTodo) => void;
  onEntered?: (node: AnyBecauseTodo) => void;
  onEntering?: (node: AnyBecauseTodo) => void;
  onExit?: (node: AnyBecauseTodo) => void;
  onExiting?: (node: AnyBecauseTodo) => void;
  timeout?: number
}

export type CollapseClassKey = 'container' | 'entered' | 'wrapper' | 'wrapperInner';

export const styles = defineStyles("MuiCollapse", theme => ({
  /* Styles applied to the container element. */
  container: {
    height: 0,
    overflow: 'hidden',
    transition: theme.transitions.create('height'),
  },
  /* Styles applied to the container element when the transition has entered. */
  entered: {
    height: 'auto',
  },
  /* Styles applied to the outer wrapper element. */
  wrapper: {
    // Hack to get children with a negative margin to not falsify the height computation.
    display: 'flex',
  },
  /* Styles applied to the inner wrapper element. */
  wrapperInner: {
    width: '100%',
  },
}), {stylePriority: -10});

/**
 * The Collapse transition is used by the
 * [Vertical Stepper](/demos/steppers#vertical-stepper) StepContent component.
 * It uses [react-transition-group](https://github.com/reactjs/react-transition-group) internally.
 */
const Collapse = (props: CollapseProps) => {
  const classes = useStyles(styles);
  const nodeRef = useRef<HTMLDivElement|null>(null);
  const wrapperRef = useRef<HTMLDivElement|null>(null);

  const handleEnter = () => {
    if (nodeRef.current) {
      nodeRef.current.style.height = "0px";
    }

    if (props.onEnter) {
      props.onEnter(nodeRef.current);
    }
  };

  const handleEntering = () => {
    const wrapperHeight = wrapperRef.current ? wrapperRef.current.clientHeight : 0;
    const transitionDuration = props.timeout;

    if (nodeRef.current) {
      nodeRef.current.style.transitionDuration = typeof transitionDuration === 'string' ? transitionDuration : `${transitionDuration}ms`;
      nodeRef.current.style.height = `${wrapperHeight}px`;
    }
    props.onEntering?.(nodeRef.current);
  };

  const handleEntered = () => {
    if (nodeRef.current) {
      nodeRef.current.style.height = 'auto';
    }
    props.onEntered?.(nodeRef.current);
  };

  const handleExit = () => {
    const wrapperHeight = wrapperRef.current ? wrapperRef.current.clientHeight : 0;
    if (nodeRef.current) {
      nodeRef.current.style.height = `${wrapperHeight}px`;
    }

    props.onExit?.(nodeRef.current);
  };

  const handleExiting = () => {
    const transitionDuration = props.timeout;

    if (nodeRef.current) {
      nodeRef.current.style.transitionDuration = typeof transitionDuration === 'string' ? transitionDuration : `${transitionDuration}ms`;
      nodeRef.current.style.height = "0px";
    }

    props.onExiting?.(nodeRef.current);
  };

  const {
    children,
    className,
    timeout=duration.standard,
  } = props;

  return (
    <Transition
      onEnter={handleEnter}
      onEntered={handleEntered}
      onEntering={handleEntering}
      onExit={handleExit}
      onExiting={handleExiting}
      timeout={timeout}
      nodeRef={nodeRef}
      in={props.in}
    >
      {(state, childProps) => <div
        className={classNames(
          classes.container,
          {
            [classes.entered]: state === 'entered',
          },
          className,
        )}
        style={{
          minHeight: "0px",
        }}
        ref={nodeRef}
        {...childProps}
      >
        <div
          className={classes.wrapper}
          ref={wrapperRef}
        >
          <div className={classes.wrapperInner}>{children}</div>
        </div>
      </div>}
    </Transition>
  );
}

export default Collapse;
