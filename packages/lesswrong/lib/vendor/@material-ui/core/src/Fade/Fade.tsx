// @inheritedComponent Transition

import React from 'react';
import Transition, { TransitionProps } from 'react-transition-group/Transition';
import { duration } from '../styles/transitions';
import { reflow, getTransitionProps } from '../transitions/utils';
import { withTheme } from '@/components/themes/useTheme';

export interface FadeProps extends TransitionProps {
  theme: ThemeType;
}

const styles = {
  entering: {
    opacity: 1,
  },
  entered: {
    opacity: 1,
  },
};

/**
 * The Fade transition is used by the [Modal](/utils/modal) component.
 * It uses [react-transition-group](https://github.com/reactjs/react-transition-group) internally.
 */
class Fade extends React.Component<FadeProps> {
  handleEnter = node => {
    const { theme } = this.props;
    reflow(node); // So the animation always start from the start.

    const transitionProps = getTransitionProps(this.props, {
      mode: 'enter',
    });
    node.style.webkitTransition = theme.transitions.create('opacity', transitionProps);
    node.style.transition = theme.transitions.create('opacity', transitionProps);

    if (this.props.onEnter) {
      this.props.onEnter(node, false);
    }
  };

  handleExit = node => {
    const { theme } = this.props;
    const transitionProps = getTransitionProps(this.props, {
      mode: 'exit',
    });
    node.style.webkitTransition = theme.transitions.create('opacity', transitionProps);
    node.style.transition = theme.transitions.create('opacity', transitionProps);

    if (this.props.onExit) {
      this.props.onExit(node);
    }
  };

  render() {
    const { children, onEnter, onExit, style: styleProp, theme, ...other } = this.props;

    const style = {
      ...styleProp,
      ...(React.isValidElement(children) ? children.props.style : {}),
    };

    return (
      <Transition appear onEnter={this.handleEnter} onExit={this.handleExit} {...other}>
        {(state, childProps) => {
          return React.cloneElement(children, {
            style: {
              opacity: 0,
              willChange: 'opacity',
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

Fade.defaultProps = {
  timeout: {
    enter: duration.enteringScreen,
    exit: duration.leavingScreen,
  },
};

export default withTheme(Fade);
