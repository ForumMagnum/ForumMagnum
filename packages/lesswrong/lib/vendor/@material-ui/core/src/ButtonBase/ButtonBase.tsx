import React from 'react';
import ReactDOM from 'react-dom';
import classNames from 'classnames';
import keycode from 'keycode';
import ownerWindow from '../utils/ownerWindow';
import { listenForFocusKeys, detectFocusVisible } from './focusVisible';
import TouchRipple from './TouchRipple';
import createRippleHandler from './createRippleHandler';
import type { StandardProps } from '..';
import { defineStyles, withStyles } from '@/components/hooks/useStyles';

export interface ButtonBaseProps
  extends StandardProps<
      React.AnchorHTMLAttributes<HTMLElement> & React.ButtonHTMLAttributes<HTMLElement>,
      ButtonBaseClassKey
    > {
  action?: (actions: ButtonBaseActions) => void;
  centerRipple?: boolean;
  component?: "button"|"li"|"span";
  disableRipple?: boolean;
  disableTouchRipple?: boolean;
  focusRipple?: boolean;
  focusVisibleClassName?: string;
  onFocusVisible?: React.FocusEventHandler<any>;
  children?: React.ReactNode;
}

export type ButtonBaseClassKey = 'root' | 'disabled' | 'focusVisible';

export interface ButtonBaseActions {
  focusVisible(): void;
}

export const styles = defineStyles("MuiButtonBase", theme => ({
  /* Styles applied to the root element. */
  root: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    // Remove grey highlight
    WebkitTapHighlightColor: 'transparent',
    backgroundColor: 'transparent', // Reset default value
    // We disable the focus ring for mouse, touch and keyboard users.
    outline: 'none',
    border: 0,
    margin: 0, // Remove the margin in Safari
    borderRadius: 0,
    padding: 0, // Remove the padding in Firefox
    cursor: 'pointer',
    userSelect: 'none',
    verticalAlign: 'middle',
    '-moz-appearance': 'none', // Reset
    '-webkit-appearance': 'none', // Reset
    textDecoration: 'none',
    // So we take precedent over the style of a native <a /> element.
    color: 'inherit',
    '&::-moz-focus-inner': {
      borderStyle: 'none', // Remove Firefox dotted outline.
    },
    '&$disabled': {
      pointerEvents: 'none', // Disable link interactions
      cursor: 'default',
    },
  },
  /* Styles applied to the root element if `disabled={true}`. */
  disabled: {},
  /* Styles applied to the root element if keyboard focused. */
  focusVisible: {},
}), {stylePriority: -11});

/**
 * `ButtonBase` contains as few styles as possible.
 * It aims to be a simple building block for creating a button.
 * It contains a load of style reset and some focus/ripple logic.
 */
class ButtonBase extends React.Component<ButtonBaseProps & WithStylesProps<typeof styles>> {
  buttonRef = React.createRef<HTMLElement>()

  state = {
    focusVisible: false
  };
  focusVisibleTimeout: ReturnType<typeof setTimeout>|null
  button: AnyBecauseTodo
  ripple: AnyBecauseTodo

  keyDown = false; // Used to help track keyboard activation keyDown

  focusVisibleCheckTime = 50;

  focusVisibleMaxCheckTimes = 5;

  handleMouseDown = createRippleHandler(this, 'MouseDown', 'start', () => {
    if (this.focusVisibleTimeout) {
      clearTimeout(this.focusVisibleTimeout);
    }
    if (this.state.focusVisible) {
      this.setState({ focusVisible: false });
    }
  });

  handleMouseUp = createRippleHandler(this, 'MouseUp', 'stop');

  handleMouseLeave = createRippleHandler(this, 'MouseLeave', 'stop', (event: AnyBecauseTodo) => {
    if (this.state.focusVisible) {
      event.preventDefault();
    }
  });

  handleTouchStart = createRippleHandler(this, 'TouchStart', 'start');

  handleTouchEnd = createRippleHandler(this, 'TouchEnd', 'stop');

  handleTouchMove = createRippleHandler(this, 'TouchMove', 'stop');

  handleBlur = createRippleHandler(this, 'Blur', 'stop', () => {
    if (this.focusVisibleTimeout) {
      clearTimeout(this.focusVisibleTimeout);
    }
    if (this.state.focusVisible) {
      this.setState({ focusVisible: false });
    }
  });

  componentDidMount() {
    //this.button = ReactDOM.findDOMNode(this);
    listenForFocusKeys(ownerWindow(this.buttonRef.current!));

    if (this.props.action) {
      this.props.action({
        focusVisible: () => {
          this.setState({ focusVisible: true });
          this.button.focus();
        },
      });
    }
  }

  componentDidUpdate(prevProps: AnyBecauseTodo, prevState: AnyBecauseTodo) {
    if (
      this.props.focusRipple &&
      !this.props.disableRipple &&
      !prevState.focusVisible &&
      this.state.focusVisible
    ) {
      this.ripple.pulsate();
    }
  }

  componentWillUnmount() {
    if (this.focusVisibleTimeout) {
      clearTimeout(this.focusVisibleTimeout);
    }
  }

  onRippleRef = (node: AnyBecauseTodo) => {
    this.ripple = node;
  };

  onFocusVisibleHandler = (event: AnyBecauseTodo) => {
    this.keyDown = false;
    this.setState({ focusVisible: true });

    if (this.props.onFocusVisible) {
      this.props.onFocusVisible(event);
    }
  };

  static getDerivedStateFromProps(nextProps: AnyBecauseTodo, prevState: AnyBecauseTodo) {
    if (typeof prevState.focusVisible === 'undefined') {
      return {
        focusVisible: false,
        lastDisabled: nextProps.disabled,
      };
    }

    // The blur won't fire when the disabled state is set on a focused input.
    // We need to book keep the focused state manually.
    if (!prevState.prevState && nextProps.disabled && prevState.focusVisible) {
      return {
        focusVisible: false,
        lastDisabled: nextProps.disabled,
      };
    }

    return {
      lastDisabled: nextProps.disabled,
    };
  }

  handleKeyDown = (event: AnyBecauseTodo) => {
    const { component, focusRipple, onKeyDown, onClick } = this.props;
    const key = keycode(event);

    // Check if key is already down to avoid repeats being counted as multiple activations
    if (focusRipple && !this.keyDown && this.state.focusVisible && this.ripple && key === 'space') {
      this.keyDown = true;
      event.persist();
      this.ripple.stop(event, () => {
        this.ripple.start(event);
      });
    }

    if (onKeyDown) {
      onKeyDown(event);
    }

    // Keyboard accessibility for non interactive elements
    if (
      event.target === event.currentTarget &&
      component &&
      component !== 'button' &&
      (key === 'space' || key === 'enter') &&
      !(this.button.tagName === 'A' && this.button.href)
    ) {
      event.preventDefault();
      if (onClick) {
        onClick(event);
      }
    }
  };

  handleKeyUp = (event: AnyBecauseTodo) => {
    if (
      this.props.focusRipple &&
      keycode(event) === 'space' &&
      this.ripple &&
      this.state.focusVisible
    ) {
      this.keyDown = false;
      event.persist();
      this.ripple.stop(event, () => {
        this.ripple.pulsate(event);
      });
    }
    if (this.props.onKeyUp) {
      this.props.onKeyUp(event);
    }
  };

  handleFocus = (event: AnyBecauseTodo) => {
    if (this.props.disabled) {
      return;
    }

    // Fix for https://github.com/facebook/react/issues/7769
    if (!this.buttonRef.current) {
      this.buttonRef.current = event.currentTarget;
    }

    event.persist();
    detectFocusVisible(this, this.buttonRef.current!, () => {
      this.onFocusVisibleHandler(event);
    });

    if (this.props.onFocus) {
      this.props.onFocus(event);
    }
  };

  render() {
    const {
      action,
      centerRipple,
      children,
      classes,
      className: classNameProp,
      component,
      disabled,
      disableRipple,
      disableTouchRipple,
      focusRipple,
      focusVisibleClassName,
      onBlur,
      onFocus,
      onFocusVisible,
      onKeyDown,
      onKeyUp,
      onMouseDown,
      onMouseLeave,
      onMouseUp,
      onTouchEnd,
      onTouchMove,
      onTouchStart,
      tabIndex,
      type,
      ...other
    } = this.props;

    const className = classNames(
      classes.root,
      {
        [classes.disabled]: disabled,
        [classes.focusVisible]: this.state.focusVisible,
      },
      this.state.focusVisible && focusVisibleClassName,
      classNameProp,
    );

    const buttonProps: AnyBecauseTodo = {};

    let ComponentProp: AnyBecauseTodo = component;

    if (ComponentProp === 'button' && other.href) {
      ComponentProp = 'a';
    }

    if (ComponentProp === 'button') {
      buttonProps.type = type || 'button';
      buttonProps.disabled = disabled;
    } else {
      buttonProps.role = 'button';
    }

    return (
      <ComponentProp
        onBlur={this.handleBlur}
        onFocus={this.handleFocus}
        onKeyDown={this.handleKeyDown}
        onKeyUp={this.handleKeyUp}
        onMouseDown={this.handleMouseDown}
        onMouseLeave={this.handleMouseLeave}
        onMouseUp={this.handleMouseUp}
        onTouchEnd={this.handleTouchEnd}
        onTouchMove={this.handleTouchMove}
        onTouchStart={this.handleTouchStart}
        tabIndex={disabled ? '-1' : tabIndex}
        className={className}
        ref={this.buttonRef}
        {...buttonProps}
        {...other}
      >
        {children}
        {!disableRipple && !disabled ? (
          <TouchRipple ref={this.onRippleRef} center={centerRipple} />
        ) : null}
      </ComponentProp>
    );
  }
}

(ButtonBase as any).defaultProps = {
  centerRipple: false,
  component: 'button',
  disableRipple: false,
  disableTouchRipple: false,
  focusRipple: false,
  tabIndex: '0',
  type: 'button',
};

export default withStyles(styles, ButtonBase);
