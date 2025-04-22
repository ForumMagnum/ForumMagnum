// @inheritedComponent Transition

import React from 'react';
import Transition, { TransitionProps } from 'react-transition-group/Transition';
import { reflow, getTransitionProps } from '../transitions/utils';
import { withTheme } from '@/components/themes/useTheme';

export interface GrowProps extends Omit<TransitionProps, 'timeout'> {
  timeout?: TransitionProps['timeout'] | 'auto';
}


function getScale(value) {
  return `scale(${value}, ${value ** 2})`;
}

const styles = {
  entering: {
    opacity: 1,
    transform: getScale(1),
  },
  entered: {
    opacity: 1,
    // Use translateZ to scrolling issue on Chrome.
    transform: `${getScale(1)} translateZ(0)`,
  },
};

/**
 * The Grow transition is used by the [Tooltip](/demos/tooltips) and
 * [Popover](/utils/popover) components.
 * It uses [react-transition-group](https://github.com/reactjs/react-transition-group) internally.
 */
class Grow extends React.Component<GrowProps & {theme: ThemeType}> {
  timer: ReturnType<typeof setTimeout>

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  handleEnter = node => {
    const { theme, timeout='auto' } = this.props;
    reflow(node); // So the animation always start from the start.

    const { duration: transitionDuration, delay } = getTransitionProps(this.props, {
      mode: 'enter',
    });
    let duration = 0;
    if (timeout === 'auto') {
      duration = theme.transitions.getAutoHeightDuration(node.clientHeight);
      this.autoTimeout = duration;
    } else {
      duration = transitionDuration;
    }

    node.style.transition = [
      theme.transitions.create('opacity', {
        duration,
        delay,
      }),
      theme.transitions.create('transform', {
        duration: duration * 0.666,
        delay,
      }),
    ].join(',');

    if (this.props.onEnter) {
      this.props.onEnter(node);
    }
  };

  handleExit = node => {
    const { theme, timeout='auto' } = this.props;
    let duration = 0;

    const { duration: transitionDuration, delay } = getTransitionProps(this.props, {
      mode: 'exit',
    });
    if (timeout === 'auto') {
      duration = theme.transitions.getAutoHeightDuration(node.clientHeight);
      this.autoTimeout = duration;
    } else {
      duration = transitionDuration;
    }

    node.style.transition = [
      theme.transitions.create('opacity', {
        duration,
        delay,
      }),
      theme.transitions.create('transform', {
        duration: duration * 0.666,
        delay: delay || duration * 0.333,
      }),
    ].join(',');

    node.style.opacity = '0';
    node.style.transform = getScale(0.75);

    if (this.props.onExit) {
      this.props.onExit(node);
    }
  };

  addEndListener = (_, next) => {
    if (this.props.timeout === 'auto') {
      this.timer = setTimeout(next, this.autoTimeout || 0);
    }
  };

  render() {
    const { children, onEnter, onExit, style: styleProp, theme, timeout='auto', ...other } = this.props;

    const style = {
      ...styleProp,
      ...(React.isValidElement(children) ? children.props.style : {}),
    };

    return (
      <Transition
        appear
        onEnter={this.handleEnter}
        onExit={this.handleExit}
        addEndListener={this.addEndListener}
        timeout={timeout === 'auto' ? null : timeout}
        {...other}
      >
        {(state, childProps) => {
          return React.cloneElement(children, {
            style: {
              opacity: 0,
              transform: getScale(0.75),
              ...styles[state],
              ...style,
            },
            ...childProps,
          });
        }}
      </Transition>
    );
  }
}

Grow.muiSupportAuto = true;

export default withTheme(Grow);
