// @inheritedComponent Transition

import React from 'react';
import classNames from 'classnames';
import Transition from 'react-transition-group/Transition';
import { duration } from '../styles/transitions';
import { getTransitionProps } from '../transitions/utils';
import type { TransitionProps } from "../transitions/transition";
import type { StandardProps } from '..';
import { defineStyles, withStyles } from '@/components/hooks/useStyles';
import { withTheme } from '@/components/themes/useTheme';

export interface CollapseProps {
  children?: React.ReactNode;
  in?: boolean;
  className?: string;
  onEnter?: (node: AnyBecauseTodo) => void;
  onEntered?: (node: AnyBecauseTodo) => void;
  onEntering?: (node: AnyBecauseTodo) => void;
  onExit?: (node: AnyBecauseTodo) => void;
  onExiting?: (node: AnyBecauseTodo) => void;
  collapsedHeight?: string;
  component?: React.ComponentType<CollapseProps>;
  timeout?: TransitionProps['timeout'] | 'auto';
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
class Collapse extends React.Component<CollapseProps & WithStylesProps<typeof styles> & {theme: ThemeType}> {
  timer: AnyBecauseTodo
  wrapperRef: AnyBecauseTodo
  autoTransitionDuration: AnyBecauseTodo

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  handleEnter = (node: AnyBecauseTodo) => {
    node.style.height = this.props.collapsedHeight ?? "0px";

    if (this.props.onEnter) {
      this.props.onEnter(node);
    }
  };

  handleEntering = (node: AnyBecauseTodo) => {
    const { timeout, theme } = this.props;
    const wrapperHeight = this.wrapperRef ? this.wrapperRef.clientHeight : 0;

    const { duration: transitionDuration } = getTransitionProps(this.props, {
      mode: 'enter',
    });

    if (timeout === 'auto') {
      const duration2 = theme.transitions.getAutoHeightDuration(wrapperHeight);
      node.style.transitionDuration = `${duration2}ms`;
      this.autoTransitionDuration = duration2;
    } else {
      node.style.transitionDuration =
        typeof transitionDuration === 'string' ? transitionDuration : `${transitionDuration}ms`;
    }

    node.style.height = `${wrapperHeight}px`;

    if (this.props.onEntering) {
      this.props.onEntering(node);
    }
  };

  handleEntered = (node: AnyBecauseTodo) => {
    node.style.height = 'auto';

    if (this.props.onEntered) {
      this.props.onEntered(node);
    }
  };

  handleExit = (node: AnyBecauseTodo) => {
    const wrapperHeight = this.wrapperRef ? this.wrapperRef.clientHeight : 0;
    node.style.height = `${wrapperHeight}px`;

    if (this.props.onExit) {
      this.props.onExit(node);
    }
  };

  handleExiting = (node: AnyBecauseTodo) => {
    const { timeout, theme } = this.props;
    const wrapperHeight = this.wrapperRef ? this.wrapperRef.clientHeight : 0;

    const { duration: transitionDuration } = getTransitionProps(this.props, {
      mode: 'exit',
    });

    if (timeout === 'auto') {
      const duration2 = theme.transitions.getAutoHeightDuration(wrapperHeight);
      node.style.transitionDuration = `${duration2}ms`;
      this.autoTransitionDuration = duration2;
    } else {
      node.style.transitionDuration =
        typeof transitionDuration === 'string' ? transitionDuration : `${transitionDuration}ms`;
    }

    node.style.height = this.props.collapsedHeight ?? "0px";

    if (this.props.onExiting) {
      this.props.onExiting(node);
    }
  };

  addEndListener = (_, next) => {
    if (this.props.timeout === 'auto') {
      this.timer = setTimeout(next, this.autoTransitionDuration || 0);
    }
  };

  render() {
    const {
      children,
      classes,
      className,
      collapsedHeight="0px",
      onEnter,
      onEntered,
      onEntering,
      onExit,
      onExiting,
      theme,
      timeout=duration.standard,
      ...other
    } = this.props;

    return (
      <Transition
        onEnter={this.handleEnter}
        onEntered={this.handleEntered}
        onEntering={this.handleEntering}
        onExit={this.handleExit}
        onExiting={this.handleExiting}
        addEndListener={this.addEndListener}
        timeout={timeout === 'auto' ? null : timeout}
        {...other}
      >
        {(state, childProps) => {
          return (
            <div
              className={classNames(
                classes.container,
                {
                  [classes.entered]: state === 'entered',
                },
                className,
              )}
              style={{
                minHeight: collapsedHeight,
              }}
              {...childProps}
            >
              <div
                className={classes.wrapper}
                ref={ref => {
                  this.wrapperRef = ref;
                }}
              >
                <div className={classes.wrapperInner}>{children}</div>
              </div>
            </div>
          );
        }}
      </Transition>
    );
  }
}

(Collapse as any).muiSupportAuto = true;

export default withTheme(withStyles(styles, Collapse));
